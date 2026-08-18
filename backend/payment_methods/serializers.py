import re

from rest_framework import serializers

from .models import PaymentMethod


class PaymentMethodSerializer(serializers.ModelSerializer):

    identifier = serializers.CharField(
        write_only=True,
        min_length=4,
        max_length=100,
    )

    class Meta:
        model = PaymentMethod
        fields = [
            'id',
            'type',
            'alias',
            'institution',
            'currency',
            'identifier',
            'last_four',
            'status',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'last_four',
            'status',
            'created_at',
            'updated_at',
        ]

    def validate_alias(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'El alias es obligatorio.'
            )

        return value

    def validate_institution(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'La institución es obligatoria.'
            )

        return value

    def validate_currency(self, value):
        value = value.strip().upper()

        if not re.fullmatch(r'[A-Z]{3}', value):
            raise serializers.ValidationError(
                'La moneda debe tener un código ISO 4217 de 3 letras.'
            )

        return value

    def validate_identifier(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'El identificador es obligatorio.'
            )

        return value

    def validate(self, attrs):
        payment_type = attrs.get('type')
        identifier = attrs.get('identifier')

        if not payment_type or not identifier:
            return attrs

        normalized = ''.join(identifier.split())

        if payment_type == PaymentMethod.PaymentType.CLABE:
            if not normalized.isdigit() or len(normalized) != 18:
                raise serializers.ValidationError({
                    'identifier': 'La CLABE debe contener exactamente 18 dígitos.'
                })

        elif payment_type == PaymentMethod.PaymentType.CARD:
            if not normalized.isdigit():
                raise serializers.ValidationError({
                    'identifier': 'La tarjeta debe contener únicamente dígitos.'
                })

            if len(normalized) not in (13, 14, 15, 16, 17, 18, 19):
                raise serializers.ValidationError({
                    'identifier': 'La tarjeta debe tener entre 13 y 19 dígitos.'
                })

            if not self._passes_luhn(normalized):
                raise serializers.ValidationError({
                    'identifier': 'El número de tarjeta no es válido.'
                })

        return attrs

    @staticmethod
    def _passes_luhn(number):
        total = 0
        reverse_digits = number[::-1]

        for index, digit in enumerate(reverse_digits):
            value = int(digit)

            if index % 2 == 1:
                value *= 2

                if value > 9:
                    value -= 9

            total += value

        return total % 10 == 0