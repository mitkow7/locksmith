from rest_framework import generics
from .models import VaultItem, VaultFolder, VaultItemTag
from .serializers import VaultItemSerializer, VaultFolderSerializer, VaultItemTagSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
import secrets
import string
from django.core.exceptions import ValidationError
from django.utils import timezone

class VaultItemListCreateView(generics.ListCreateAPIView):
    serializer_class = VaultItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return VaultItem.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class VaultItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VaultItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return VaultItem.objects.filter(user=self.request.user)
    
    def get_object(self):
        obj = super().get_object()
        return obj


class VaultFolderListCreateView(generics.ListCreateAPIView):
    serializer_class = VaultFolderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return VaultFolder.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Check if folder name already exists for this user
        if VaultFolder.objects.filter(
            user=self.request.user, 
            name=serializer.validated_data['name']
        ).exists():
            raise ValidationError("Folder with this name already exists")
        
        serializer.save(user=self.request.user)

class VaultFolderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VaultFolderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return VaultFolder.objects.filter(user=self.request.user)
    
    def perform_destroy(self, instance):
        VaultItem.objects.filter(
            user=self.request.user,
            folder=instance
        ).update(folder=None)
        
        instance.delete()


class VaultItemTagListCreateView(generics.ListCreateAPIView):
    queryset = VaultItemTag.objects.all()
    serializer_class = VaultItemTagSerializer

class VaultItemTagDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = VaultItemTag.objects.all()
    serializer_class = VaultItemTagSerializer

class VaultItemByTypeView(generics.ListAPIView):
    serializer_class = VaultItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        item_type = self.kwargs['item_type']
        return VaultItem.objects.filter(
            user=self.request.user,
            item_type=item_type
        ).order_by('-updated_at')

class VaultItemFavoritesView(generics.ListAPIView):
    serializer_class = VaultItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return VaultItem.objects.filter(
            user=self.request.user,
            is_favorite=True
        ).order_by('-updated_at')

class VaultItemByFolderView(generics.ListAPIView):
    serializer_class = VaultItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        folder_id = self.kwargs['folder_id']
        return VaultItem.objects.filter(
            user=self.request.user,
            folder_id=folder_id
        ).order_by('-updated_at')

class GeneratePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        length = request.data.get('length', 16)
        include_symbols = request.data.get('include_symbols', True)
        
        chars = string.ascii_letters + string.digits
        if include_symbols:
            chars += "!@#$%^&*"
        
        password = ''.join(secrets.choice(chars) for _ in range(length))
        
        return Response({'password': password})

class UserEncryptionKeyView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]