from django.db import models
from django.contrib.auth.models import User
from .choices import ItemTypeChoices, StrengthChoices


class VaultItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    item_type = models.CharField(
        max_length=10,
        choices=ItemTypeChoices.choices,
    )
    name = models.CharField(max_length=255)
    encrypted_data = models.TextField()
    folder = models.ForeignKey('VaultFolder', on_delete=models.SET_NULL, null=True, blank=True)
    is_favorite = models.BooleanField(default=False)
    strength = models.CharField(
        max_length=12,
        choices=StrengthChoices.choices,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    
class VaultItemTag(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)


class VaultItemTagRelation(models.Model):
    vault_item = models.ForeignKey(VaultItem, on_delete=models.CASCADE)
    vault_item_tag = models.ForeignKey(VaultItemTag, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.vault_item.name} - {self.vault_item_tag.name}"


class UserEncryptionKey(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    encryption_key = models.TextField()
    salt = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.encryption_key}"


class VaultFolder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
