from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Profile

class ProfileSignalTest(TestCase):
    def test_profile_created_on_user_creation(self):
        """Test that a profile is automatically created when a user is created"""
        user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123'
        )
        
        # Check that profile was created automatically
        self.assertTrue(Profile.objects.filter(user=user).exists())
        
        profile = Profile.objects.get(user=user)
        self.assertEqual(profile.user, user)

class UserRegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
    
    def test_email_registration(self):
        """Test user registration with email"""
        data = {
            'email': 'newuser@example.com',
            'password': 'securepass123',
            'password_confirm': 'securepass123',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        
        response = self.client.post('/api/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check user was created
        user = User.objects.get(email='newuser@example.com')
        self.assertEqual(user.username, 'newuser@example.com')  # Email used as username
        self.assertEqual(user.first_name, 'John')
        
        # Check profile was created via signal
        self.assertTrue(Profile.objects.filter(user=user).exists())
