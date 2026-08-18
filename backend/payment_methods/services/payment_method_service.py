from django.db import IntegrityError, transaction
from django.utils import timezone

from audit.services import create_audit_log

from ..models import PaymentMethod
from .security import get_last_four, hash_identifier


class PaymentMethodService:

    @staticmethod
    @transaction.atomic
    def create_payment_method(
        *,
        user,
        validated_data,
        request,
    ):
        identifier = validated_data.pop('identifier')

        identifier_hash = hash_identifier(identifier)
        last_four = get_last_four(identifier)

        existing = PaymentMethod.all_objects.filter(
            user=user,
            identifier_hash=identifier_hash,
        ).first()

        if existing:
            if existing.deleted_at is not None:
                existing.deleted_at = None
                existing.status = PaymentMethod.Status.ACTIVE
                existing.alias = validated_data.get(
                    'alias',
                    existing.alias,
                )
                existing.institution = validated_data.get(
                    'institution',
                    existing.institution,
                )
                existing.currency = validated_data.get(
                    'currency',
                    existing.currency,
                )
                existing.type = validated_data.get(
                    'type',
                    existing.type,
                )
                existing.last_four = last_four

                existing.save()

                create_audit_log(
                    action='REACTIVATE_PAYMENT_METHOD',
                    user=user,
                    request=request,
                    resource_type='PaymentMethod',
                    resource_id=existing.id,
                    metadata={
                        'type': existing.type,
                    },
                )

                return existing

            raise ValueError(
                'Ya existe un método de pago con este identificador.'
            )

        try:
            payment_method = PaymentMethod.all_objects.create(
                user=user,
                identifier_hash=identifier_hash,
                last_four=last_four,
                status=PaymentMethod.Status.ACTIVE,
                **validated_data,
            )
        except IntegrityError:
            raise ValueError(
                'Ya existe un método de pago con este identificador.'
            )

        create_audit_log(
            action='CREATE_PAYMENT_METHOD',
            user=user,
            request=request,
            resource_type='PaymentMethod',
            resource_id=payment_method.id,
            metadata={
                'type': payment_method.type,
            },
        )

        return payment_method

    @staticmethod
    @transaction.atomic
    def deactivate_payment_method(
        *,
        payment_method,
        user,
        request,
    ):
        payment_method.deleted_at = timezone.now()
        payment_method.status = PaymentMethod.Status.INACTIVE

        payment_method.save(
            update_fields=[
                'deleted_at',
                'status',
                'updated_at',
            ]
        )

        create_audit_log(
            action='DELETE_PAYMENT_METHOD',
            user=user,
            request=request,
            resource_type='PaymentMethod',
            resource_id=payment_method.id,
            metadata={
                'type': payment_method.type,
            },
        )

        return payment_method