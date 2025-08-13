from rest_framework import serializers
from .models import VaultItem, VaultFolder, VaultItemTag, VaultItemTagRelation
import json

class VaultItemSerializer(serializers.ModelSerializer):
    # Only accept encrypted data from frontend
    encrypted_data = serializers.CharField(write_only=True)
    
    # Metadata that's safe to store unencrypted
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    tags = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = VaultItem
        fields = [
            'id', 'item_type', 'name', 'is_favorite', 'strength',
            'folder', 'created_at', 'updated_at', 'folder_name', 'tags',
            'encrypted_data'  # ← Only this field for sensitive data
        ]
        extra_kwargs = {
            'encrypted_data': {'write_only': True}
        }
    
    def get_tags(self, obj):
        """Return list of tag names"""
        return [relation.vault_item_tag.name for relation in obj.tag_relations.all()]
    
    def create(self, validated_data):
        """Store encrypted data as-is from frontend"""
        # Server just stores the encrypted blob - never decrypts it
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update with new encrypted data from frontend"""
        # Server just replaces the encrypted blob
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Return data to frontend (including encrypted blob)"""
        data = super().to_representation(instance)
        # Add the encrypted data for frontend to decrypt
        data['encrypted_data'] = instance.encrypted_data
        return data


# Simplified other serializers...
class VaultFolderSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = VaultFolder
        fields = ['id', 'name', 'created_at', 'items_count']
    
    def get_items_count(self, obj):
        return obj.vaultitem_set.count()


class VaultItemTagSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = VaultItemTag
        fields = ['id', 'name', 'items_count']
    
    def get_items_count(self, obj):
        return obj.item_relations.count()
