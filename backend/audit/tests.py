from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from audit.models import AuditLog
from payment_methods.models import PaymentMethod


class AuditLogActionTests(APITestCase):

    password = 'StrongPass123'

    def setUp(self):
        self.user = User.objects.create_user(
            username='audituser',
            email='audit@example.com',
            password=self.password,
        )

    def test_register_creates_audit_log(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'username': 'newaudit',
                'email': 'newaudit@example.com',
                'password': self.password,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='newaudit')
        log = AuditLog.objects.get(action='REGISTER', user=user)
        self.assertEqual(log.metadata.get('username'), 'newaudit')

    def test_login_creates_audit_log(self):
        response = self.client.post(
            '/api/auth/login/',
            {
                'username': 'audituser',
                'password': self.password,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            AuditLog.objects.filter(action='LOGIN', user=self.user).exists()
        )

    def test_logout_creates_audit_log(self):
        self.client.post(
            '/api/auth/login/',
            {
                'username': 'audituser',
                'password': self.password,
            },
            format='json',
        )

        response = self.client.post('/api/auth/logout/', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            AuditLog.objects.filter(action='LOGOUT', user=self.user).exists()
        )

    def test_create_payment_method_creates_audit_log(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            '/api/payment-methods/',
            {
                'type': 'CARD',
                'alias': 'Principal',
                'institution': 'BBVA',
                'currency': 'MXN',
                'identifier': '4111111111111111',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        log = AuditLog.objects.get(
            action='CREATE_PAYMENT_METHOD',
            user=self.user,
        )
        self.assertEqual(log.resource_type, 'PaymentMethod')
        self.assertEqual(log.resource_id, str(response.data['id']))
        self.assertEqual(log.metadata.get('type'), 'CARD')

    def test_delete_payment_method_creates_audit_log(self):
        self.client.force_authenticate(user=self.user)

        created = self.client.post(
            '/api/payment-methods/',
            {
                'type': 'CARD',
                'alias': 'Principal',
                'institution': 'BBVA',
                'currency': 'MXN',
                'identifier': '4111111111111111',
            },
            format='json',
        )
        method_id = created.data['id']

        response = self.client.delete(f'/api/payment-methods/{method_id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        log = AuditLog.objects.get(
            action='DELETE_PAYMENT_METHOD',
            user=self.user,
        )
        self.assertEqual(log.resource_type, 'PaymentMethod')
        self.assertEqual(log.resource_id, str(method_id))

    def test_reactivate_payment_method_creates_audit_log(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'type': 'CARD',
            'alias': 'Principal',
            'institution': 'BBVA',
            'currency': 'MXN',
            'identifier': '4111111111111111',
        }

        created = self.client.post('/api/payment-methods/', payload, format='json')
        method_id = created.data['id']
        self.client.delete(f'/api/payment-methods/{method_id}/')

        response = self.client.post(
            '/api/payment-methods/',
            {
                **payload,
                'alias': 'Reactivada',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['id'], method_id)
        log = AuditLog.objects.get(
            action='REACTIVATE_PAYMENT_METHOD',
            user=self.user,
        )
        self.assertEqual(log.resource_type, 'PaymentMethod')
        self.assertEqual(log.resource_id, str(method_id))
        self.assertEqual(PaymentMethod.objects.get(pk=method_id).alias, 'Reactivada')
        self.assertEqual(
            AuditLog.objects.filter(
                action='CREATE_PAYMENT_METHOD',
                user=self.user,
            ).count(),
            1,
        )
        self.assertEqual(
            AuditLog.objects.filter(
                action='REACTIVATE_PAYMENT_METHOD',
                user=self.user,
            ).count(),
            1,
        )
