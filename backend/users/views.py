from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.db import transaction

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.services import create_audit_log

from .serializers import LoginSerializer, RegisterSerializer


class RegisterView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user = serializer.save()
            create_audit_log(
                action='REGISTER',
                user=user,
                request=request,
                metadata={
                    'username': user.username,
                },
            )

        return Response(
            {
                'message': 'Usuario registrado correctamente.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
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

        user = authenticate(
            request=request,
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response(
                {
                    'detail': 'Credenciales inválidas.'
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {
                    'detail': 'Esta cuenta está desactivada.'
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)

        create_audit_log(
            action='LOGIN',
            user=user,
            request=request,
        )

        return Response(
            {
                'message': 'Inicio de sesión exitoso.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
            },
            status=status.HTTP_200_OK,
        )

class MeView(APIView):

    def get(self, request):
        return Response(
            {
                'user': {
                    'id': request.user.id,
                    'username': request.user.username,
                    'email': request.user.email,
                }
            },
            status=status.HTTP_200_OK,
        )

class LogoutView(APIView):

    def post(self, request):
        user = request.user

        create_audit_log(
            action='LOGOUT',
            user=user,
            request=request,
        )

        logout(request)

        return Response(
            {
                'message': 'Sesión cerrada correctamente.'
            },
            status=status.HTTP_200_OK,
        )