from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

REQUIRED_FIELD_ERROR = 'Este campo es obligatorio.'


class RegisterSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(
        required=True,
    )

    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'Este correo electrónico ya está registrado.'
            )

        return value.lower()

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                'Este nombre de usuario ya está registrado.'
            )

        return value


class LoginSerializer(serializers.Serializer):

    username = serializers.CharField(
        error_messages={
            'required': REQUIRED_FIELD_ERROR,
            'blank': REQUIRED_FIELD_ERROR,
        },
    )

    password = serializers.CharField(
        write_only=True,
        error_messages={
            'required': REQUIRED_FIELD_ERROR,
            'blank': REQUIRED_FIELD_ERROR,
        },
    )
