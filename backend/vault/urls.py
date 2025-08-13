from django.urls import path
from . import views

urlpatterns = [
    # Vault Items
    path('items/', views.VaultItemListCreateView.as_view(), name='vault-items'),
    path('items/<int:pk>/', views.VaultItemDetailView.as_view(), name='vault-item-detail'),
    path('items/type/<str:item_type>/', views.VaultItemByTypeView.as_view(), name='vault-items-by-type'),
    path('items/favorites/', views.VaultItemFavoritesView.as_view(), name='vault-favorites'),
    path('items/folder/<int:folder_id>/', views.VaultItemByFolderView.as_view(), name='vault-items-by-folder'),
    
    # Folders
    path('folders/', views.VaultFolderListCreateView.as_view(), name='vault-folders'),
    path('folders/<int:pk>/', views.VaultFolderDetailView.as_view(), name='vault-folder-detail'),
    
    # Tags
    path('tags/', views.VaultItemTagListCreateView.as_view(), name='vault-tags'),
    path('tags/<int:pk>/', views.VaultItemTagDetailView.as_view(), name='vault-tag-detail'),
    
    # Utilities
    path('generate-password/', views.GeneratePasswordView.as_view(), name='generate-password'),
]
