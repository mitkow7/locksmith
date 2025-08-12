from django.db import models


class ItemTypeChoices(models.TextChoices):
    LOGIN = "login", "Login"
    CARD = "card", "Card"
    NOTE = "note", "Note"
    IDENTITY = "identity", "Identity"


class StrengthChoices(models.TextChoices):
    STRONG = "strong", "Strong"
    WEAK = "weak", "Weak"
    COMPROMISED = "compromised", "Compromised"
