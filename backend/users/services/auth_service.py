from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError, transaction

from audit.services import create_audit_log


class DuplicateEmailError(ValueError):
    pass


class InvalidCredentialsError(ValueError):
    pass


class InactiveAccountError(ValueError):
    pass


class AuthService:

    @staticmethod
    @transaction.atomic
    def register_user(*, validated_data, request):
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
            )
        except IntegrityError as exc:
            if 'uniq_auth_user_email' in str(exc):
                raise DuplicateEmailError(
                    'Este correo electrónico ya está registrado.'
                ) from exc
            raise

        create_audit_log(
            action='REGISTER',
            user=user,
            request=request,
            metadata={
                'username': user.username,
            },
        )

        return user

    @staticmethod
    def login_user(*, request, username, password):
        user = authenticate(
            request=request,
            username=username,
            password=password,
        )

        if user is None:
            raise InvalidCredentialsError('Credenciales inválidas.')

        if not user.is_active:
            raise InactiveAccountError('Esta cuenta está desactivada.')

        login(request, user)

        create_audit_log(
            action='LOGIN',
            user=user,
            request=request,
        )

        return user

    @staticmethod
    def logout_user(*, request):
        user = request.user

        create_audit_log(
            action='LOGOUT',
            user=user,
            request=request,
        )

        logout(request)

        return user
