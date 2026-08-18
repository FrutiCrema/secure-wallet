from django.conf import settings
from django.db import models


class PaymentMethodQuerySet(models.QuerySet):

    def active_records(self):
        return self.filter(deleted_at__isnull=True)


class PaymentMethodManager(models.Manager):

    def get_queryset(self):
        return PaymentMethodQuerySet(
            self.model,
            using=self._db
        ).active_records()


class PaymentMethod(models.Model):

    class PaymentType(models.TextChoices):
        CARD = 'CARD', 'Tarjeta'
        BANK_ACCOUNT = 'BANK_ACCOUNT', 'Cuenta bancaria'
        CLABE = 'CLABE', 'CLABE'
        OTHER = 'OTHER', 'Otro'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Activo'
        INACTIVE = 'INACTIVE', 'Inactivo'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_methods'
    )

    type = models.CharField(
        max_length=20,
        choices=PaymentType.choices
    )

    alias = models.CharField(
        max_length=100
    )

    institution = models.CharField(
        max_length=100
    )

    currency = models.CharField(
        max_length=3,
        default='MXN'
    )

    identifier_hash = models.CharField(
        max_length=128
    )

    last_four = models.CharField(
        max_length=4,
        blank=True
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True
    )

    objects = PaymentMethodManager()

    all_objects = models.Manager()

    class Meta:
        db_table = 'payment_methods'

        constraints = [
            models.UniqueConstraint(
                fields=['user', 'identifier_hash'],
                name='unique_user_payment_identifier'
            ),
        ]

        indexes = [
            models.Index(
                fields=['user', 'status']
            ),
        ]

    def __str__(self):
        return f'{self.alias} - {self.institution}'