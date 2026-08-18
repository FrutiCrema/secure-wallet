from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('REGISTER', 'Register'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('CREATE_PAYMENT_METHOD', 'Create payment method'),
        ('VIEW_PAYMENT_METHOD', 'View payment method'),
        ('DELETE_PAYMENT_METHOD', 'Delete payment method'),
        ('REACTIVATE_PAYMENT_METHOD', 'Reactivate payment method'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )

    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES,
    )

    resource_type = models.CharField(
        max_length=50,
        blank=True,
    )

    resource_id = models.CharField(
        max_length=100,
        blank=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self):
        return f'{self.action} - {self.user_id} - {self.created_at}'