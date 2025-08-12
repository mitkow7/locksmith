from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = ['user', 'bio', 'two_factor_enabled']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()  # Normalize email to lowercase
    
    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value
    
    def validate(self, data):
        password = data.get('password')
        password_confirm = data.get('password_confirm')
        
        # Only validate password confirmation if it's provided
        if password_confirm and password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        return data
    
    def create(self, validated_data):
        # Remove password_confirm if it exists
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        email = validated_data['email']
        
        # Use email as username
        user = User.objects.create_user(
            username=email,  # Use email as username
            email=email,
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        return value.lower()
    
    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError("Password is required.")
        return value
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            # Additional validation can be added here if needed
            pass
        
        return data
