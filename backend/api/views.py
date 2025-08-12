from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.mail import send_mail
from django.conf import settings
from .models import Profile, TwoFactorCode
from .serializers import UserRegistrationSerializer, ProfileSerializer, UserSerializer
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(generics.CreateAPIView):
    """User registration view"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'error': 'Registration failed',
                    'details': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    """User login view with email and password"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        
        # Validate input
        if not email:
            return Response({
                'error': 'Email is required',
                'field': 'email'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if not password:
            return Response({
                'error': 'Password is required',
                'field': 'password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format
        try:
            validate_email(email)
        except ValidationError:
            return Response({
                'error': 'Please enter a valid email address',
                'field': 'email'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(request, username=email, password=password)
        if user is not None:
            if user.is_active:
                try:
                    # Check if 2FA is enabled for this user
                    profile = getattr(user, 'profile', None)
                    if profile and profile.two_factor_enabled:
                        # Generate and send 2FA code
                        two_fa_code = TwoFactorCode.generate_code(user)
                        self.send_2fa_email(user, two_fa_code.code)
                        
                        # Return response indicating 2FA is required
                        return Response({
                            'requires_2fa': True,
                            'message': 'Please check your email for the verification code',
                            'user_id': user.id
                        }, status=status.HTTP_200_OK)
                    else:
                        # No 2FA required, proceed with normal login
                        refresh = RefreshToken.for_user(user)
                        
                        response_data = {
                            'message': 'Login successful',
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                            'user': UserSerializer(user).data
                        }
                        
                        return Response(response_data, status=status.HTTP_200_OK)
                        
                except Exception as e:
                    return Response({
                        'success': False,
                        'error': 'Login failed. Please try again.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({
                    'success': False,
                    'error': 'Your account has been disabled. Please contact support.',
                    'field': 'email'
                }, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({
                'success': False,
                'error': 'Invalid email or password',
                'field': 'credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    def send_2fa_email(self, user, code):
        """Send 2FA verification code via email"""
        subject = 'Locksmith - Your Security Code'
        message = f"""
Hello {user.first_name or user.email},

Your security code for Locksmith is: {code}

This code will expire in 10 minutes. If you didn't request this code, please ignore this email.

Best regards,
Locksmith Security Team
        """.strip()
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send 2FA email: {e}")


class Verify2FAView(APIView):
    """Verify 2FA code and complete login"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        user_id = request.data.get('user_id')
        code = request.data.get('code', '').strip()
        
        if not user_id or not code:
            return Response({
                'error': 'User ID and verification code are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid user'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the most recent valid code for this user
        two_fa_code = TwoFactorCode.objects.filter(
            user=user,
            code=code,
            is_used=False
        ).first()
        
        if not two_fa_code:
            return Response({
                'error': 'Invalid verification code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if two_fa_code.is_expired():
            return Response({
                'error': 'Verification code has expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark code as used
        two_fa_code.is_used = True
        two_fa_code.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': '2FA verification successful',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class Resend2FAView(APIView):
    """Resend 2FA code"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({
                'error': 'User ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid user'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate and send new 2FA code
        two_fa_code = TwoFactorCode.generate_code(user)
        login_view = LoginView()
        login_view.send_2fa_email(user, two_fa_code.code)
        
        return Response({
            'success': True,
            'message': 'New verification code sent to your email'
        }, status=status.HTTP_200_OK)


class Toggle2FAView(APIView):
    """Enable or disable 2FA for the authenticated user"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        enable = request.data.get('enable', False)
        user = request.user
        
        # Get or create profile
        profile, created = Profile.objects.get_or_create(user=user)
        profile.two_factor_enabled = enable
        profile.save()
        
        action = "enabled" if enable else "disabled"
        return Response({
            'success': True,
            'message': f'Two-factor authentication has been {action}',
            'two_factor_enabled': enable
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """User logout view - blacklist refresh token"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'success': True,
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Logout failed'
            }, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """User profile view"""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile
