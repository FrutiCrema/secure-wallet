from rest_framework import serializers

from .models import PaymentMethod


class PaymentMethodSerializer(serializers.ModelSerializer):

    class Meta:
        model = PaymentMethod
        fields = [
            'id',
            'type',
            'alias',
            'institution',
            'currency',
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