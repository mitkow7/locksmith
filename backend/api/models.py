from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import secrets
import string


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    two_factor_enabled = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username


class TwoFactorCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-created_at']
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        return not self.is_used and not self.is_expired()
    
    @classmethod
    def generate_code(cls, user):
        code = ''.join(secrets.choice(string.digits) for _ in range(6))
        
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        
        return cls.objects.create(
            user=user,
            code=code,
            expires_at=expires_at
        )
    
    def __str__(self):
        return f"2FA Code for {self.user.email} - {self.code}"
