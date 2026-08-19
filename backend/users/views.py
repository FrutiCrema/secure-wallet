from django.middleware.csrf import get_token

from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer, RegisterSerializer
from .services.auth_service import (
    AuthService,
    DuplicateEmailError,
    InactiveAccountError,
    InvalidCredentialsError,
)


def _user_payload(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
    }


class RegisterView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = AuthService.register_user(
                validated_data=serializer.validated_data.copy(),
                request=request,
            )
        except DuplicateEmailError as error:
            raise ValidationError({
                'email': [str(error)],
            }) from error

        return Response(
            {
                'message': 'Usuario registrado correctamente.',
                'user': _user_payload(user),
            },
            status=status.HTTP_201_CREATED,
        )


class CsrfView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'csrfToken': get_token(request),
        })


class LoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = AuthService.login_user(
                request=request,
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password'],
            )
        except InvalidCredentialsError as error:
            return Response(
                {
                    'detail': str(error),
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except InactiveAccountError as error:
            return Response(
                {
                    'detail': str(error),
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {
                'message': 'Inicio de sesión exitoso.',
                'user': _user_payload(user),
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):

    def get(self, request):
        return Response(
            {
                'user': _user_payload(request.user),
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):

    def post(self, request):
        AuthService.logout_user(request=request)

        return Response(
            {
                'message': 'Sesión cerrada correctamente.',
            },
            status=status.HTTP_200_OK,
        )
