from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class UniqueEmailTests(APITestCase):

    url = '/api/auth/register/'

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(
            username='one',
            email='user@example.com',
            password='StrongPass123',
        )

        response = self.client.post(
            self.url,
            {
                'username': 'two',
                'email': 'user@example.com',
                'password': 'StrongPass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            str(response.data['email'][0]),
            'Este correo electrónico ya está registrado.',
        )
        self.assertEqual(
            User.objects.filter(email__iexact='user@example.com').count(),
            1,
        )

    def test_register_rejects_duplicate_email_case_insensitive(self):
        User.objects.create_user(
            username='one',
            email='user@example.com',
            password='StrongPass123',
        )

        response = self.client.post(
            self.url,
            {
                'username': 'two',
                'email': 'User@Example.com',
                'password': 'StrongPass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            str(response.data['email'][0]),
            'Este correo electrónico ya está registrado.',
        )

    def test_register_stores_email_lowercase(self):
        response = self.client.post(
            self.url,
            {
                'username': 'newuser',
                'email': 'New.User@Example.com',
                'password': 'StrongPass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['email'], 'new.user@example.com')
        self.assertTrue(
            User.objects.filter(email='new.user@example.com').exists()
        )


class LoginTests(APITestCase):

    url = '/api/auth/login/'
    password = 'StrongPass123'

    def setUp(self):
        self.user = User.objects.create_user(
            username='walletuser',
            email='wallet@example.com',
            password=self.password,
        )

    def test_login_success(self):
        response = self.client.post(
            self.url,
            {
                'username': 'walletuser',
                'password': self.password,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'walletuser')
        self.assertEqual(response.data['user']['email'], 'wallet@example.com')

        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['user']['username'], 'walletuser')

    def test_login_missing_fields(self):
        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        self.assertIn('password', response.data)

    def test_login_missing_password(self):
        response = self.client.post(
            self.url,
            {'username': 'walletuser'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        self.assertNotIn('detail', response.data)

    def test_login_invalid_password(self):
        response = self.client.post(
            self.url,
            {
                'username': 'walletuser',
                'password': 'WrongPass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['detail'], 'Credenciales inválidas.')

    def test_login_unknown_user_same_message(self):
        response = self.client.post(
            self.url,
            {
                'username': 'doesnotexist',
                'password': self.password,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['detail'], 'Credenciales inválidas.')
        self.assertNotIn('username', response.data)


class LogoutTests(APITestCase):

    password = 'StrongPass123'

    def setUp(self):
        self.user = User.objects.create_user(
            username='logoutuser',
            email='logout@example.com',
            password=self.password,
        )

    def test_logout_invalidates_the_session(self):
        login_response = self.client.post(
            '/api/auth/login/',
            {
                'username': 'logoutuser',
                'password': self.password,
            },
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['user']['username'], 'logoutuser')

        logout_response = self.client.post('/api/auth/logout/', format='json')
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            logout_response.data['message'],
            'Sesión cerrada correctamente.',
        )

        me_after_logout = self.client.get('/api/auth/me/')
        self.assertIn(
            me_after_logout.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
