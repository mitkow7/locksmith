from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from . import views

def csrf_token_view(request):
    """Return CSRF token for frontend"""
    from django.middleware.csrf import get_token
    return JsonResponse({'csrfToken': get_token(request)})

# Auth URLs
auth_urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    # 2FA endpoints
    path('verify-2fa/', views.Verify2FAView.as_view(), name='verify_2fa'),
    path('resend-2fa/', views.Resend2FAView.as_view(), name='resend_2fa'),
    path('toggle-2fa/', views.Toggle2FAView.as_view(), name='toggle_2fa'),
]

urlpatterns = [
    path('auth/', include(auth_urlpatterns)),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('csrf/', csrf_token_view, name='csrf_token'),
]
