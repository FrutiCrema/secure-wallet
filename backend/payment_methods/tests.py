from django.contrib.auth.models import User
from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from payment_methods.models import PaymentMethod
from payment_methods.serializers import PaymentMethodSerializer
from payment_methods.services.security import (
    get_last_four,
    hash_identifier,
    normalize_identifier,
)


class IdentifierNormalizationTests(SimpleTestCase):

    def test_serializer_uses_the_same_normalization_as_security(self):
        raw_values = [
            '  1234 5678 9012  ',
            'ab cd-12',
            '  clabe18digitsxx  ',
        ]

        serializer = PaymentMethodSerializer()

        for raw in raw_values:
            self.assertEqual(
                serializer.validate_identifier(raw),
                normalize_identifier(raw),
            )

    def test_hash_and_last_four_use_normalized_identifier(self):
        spaced = '  1234 5678  '
        compact = '12345678'

        self.assertEqual(normalize_identifier(spaced), compact.upper())
        self.assertEqual(
            hash_identifier(spaced),
            hash_identifier(compact),
        )
        self.assertEqual(get_last_four(spaced), '5678')


class BankAccountValidationTests(SimpleTestCase):

    def _payload(self, identifier):
        return {
            'type': 'BANK_ACCOUNT',
            'alias': 'Nómina',
            'institution': 'BBVA',
            'currency': 'MXN',
            'identifier': identifier,
        }

    def test_bank_account_valid(self):
        serializer = PaymentMethodSerializer(
            data=self._payload('12 345 67890'),
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(
            serializer.validated_data['identifier'],
            '1234567890',
        )

    def test_bank_account_rejects_non_digits(self):
        serializer = PaymentMethodSerializer(
            data=self._payload('AB12CD34'),
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            str(serializer.errors['identifier'][0]),
            'La cuenta bancaria debe contener únicamente dígitos.',
        )

    def test_card_and_clabe_rules_still_apply(self):
        card_serializer = PaymentMethodSerializer(
            data={
                'type': 'CARD',
                'alias': 'Visa',
                'institution': 'BBVA',
                'currency': 'MXN',
                'identifier': '4111111111111111',
            }
        )
        self.assertTrue(card_serializer.is_valid(), card_serializer.errors)

        clabe_serializer = PaymentMethodSerializer(
            data={
                'type': 'CLABE',
                'alias': 'CLABE',
                'institution': 'BBVA',
                'currency': 'MXN',
                'identifier': '123456789012345678',
            }
        )
        self.assertTrue(clabe_serializer.is_valid(), clabe_serializer.errors)


class PaymentMethodResponseTests(APITestCase):

    identifier = '4111111111111111'

    def setUp(self):
        self.user = User.objects.create_user(
            username='payer',
            email='payer@example.com',
            password='StrongPass123',
        )
        self.client.force_authenticate(user=self.user)

    def test_get_responses_never_include_full_identifier(self):
        create_response = self.client.post(
            '/api/payment-methods/',
            {
                'type': 'CARD',
                'alias': 'Principal',
                'institution': 'BBVA',
                'currency': 'MXN',
                'identifier': self.identifier,
            },
            format='json',
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('identifier', create_response.data)
        self.assertNotIn(self.identifier, str(create_response.data))
        self.assertEqual(create_response.data['last_four'], '1111')

        payment_id = create_response.data['id']

        list_response = self.client.get('/api/payment-methods/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.identifier, str(list_response.data))
        self.assertNotIn('identifier', list_response.data['results'][0])

        detail_response = self.client.get(
            f'/api/payment-methods/{payment_id}/',
        )
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertNotIn('identifier', detail_response.data)
        self.assertNotIn(self.identifier, str(detail_response.data))
        self.assertEqual(detail_response.data['last_four'], '1111')


class DuplicatePaymentMethodTests(APITestCase):

    url = '/api/payment-methods/'
    identifier = '4111111111111111'

    def setUp(self):
        self.user = User.objects.create_user(
            username='duplicateuser',
            email='duplicate@example.com',
            password='StrongPass123',
        )
        self.client.force_authenticate(user=self.user)

    def test_cannot_register_the_same_active_identifier_twice(self):
        payload = {
            'type': 'CARD',
            'alias': 'Principal',
            'institution': 'BBVA',
            'currency': 'MXN',
            'identifier': self.identifier,
        }

        first_response = self.client.post(self.url, payload, format='json')

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PaymentMethod.all_objects.filter(user=self.user).count(), 1)

        second_response = self.client.post(self.url, payload, format='json')

        self.assertEqual(second_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            second_response.data['detail'],
            'Ya existe un método de pago con este identificador.',
        )
        self.assertEqual(PaymentMethod.all_objects.filter(user=self.user).count(), 1)
        self.assertEqual(PaymentMethod.objects.filter(user=self.user).count(), 1)


class PaymentMethodIsolationTests(APITestCase):

    def setUp(self):
        self.user_a = User.objects.create_user(
            username='usera',
            email='usera@example.com',
            password='StrongPass123',
        )
        self.user_b = User.objects.create_user(
            username='userb',
            email='userb@example.com',
            password='StrongPass123',
        )

        self.client_a = APIClient()
        self.client_a.force_authenticate(user=self.user_a)
        self.client_b = APIClient()
        self.client_b.force_authenticate(user=self.user_b)

        self.method_a = self._create_method(
            self.client_a,
            '4111111111111111',
            alias='Tarjeta A',
        )
        self.method_b = self._create_method(
            self.client_b,
            '5555555555554444',
            alias='Tarjeta B',
        )

    def _create_method(self, client, identifier, alias):
        response = client.post(
            '/api/payment-methods/',
            {
                'type': 'CARD',
                'alias': alias,
                'institution': 'BBVA',
                'currency': 'MXN',
                'identifier': identifier,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data

    def test_each_user_only_lists_their_own_methods(self):
        list_a = self.client_a.get('/api/payment-methods/')
        list_b = self.client_b.get('/api/payment-methods/')

        self.assertEqual(list_a.status_code, status.HTTP_200_OK)
        self.assertEqual(list_b.status_code, status.HTTP_200_OK)
        self.assertEqual(list_a.data['count'], 1)
        self.assertEqual(list_b.data['count'], 1)
        self.assertEqual(list_a.data['results'][0]['id'], self.method_a['id'])
        self.assertEqual(list_b.data['results'][0]['id'], self.method_b['id'])
        self.assertEqual(list_a.data['results'][0]['alias'], 'Tarjeta A')
        self.assertEqual(list_b.data['results'][0]['alias'], 'Tarjeta B')

    def test_user_cannot_view_another_users_method(self):
        response = self.client_a.get(
            f'/api/payment-methods/{self.method_b["id"]}/',
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Método de pago no encontrado.')

        own_detail = self.client_b.get(
            f'/api/payment-methods/{self.method_b["id"]}/',
        )
        self.assertEqual(own_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(own_detail.data['alias'], 'Tarjeta B')

    def test_user_cannot_deactivate_another_users_method(self):
        response = self.client_a.delete(
            f'/api/payment-methods/{self.method_b["id"]}/',
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Método de pago no encontrado.')

        method_b = PaymentMethod.objects.get(pk=self.method_b['id'])
        self.assertEqual(method_b.status, PaymentMethod.Status.ACTIVE)
        self.assertIsNone(method_b.deleted_at)
        self.assertEqual(method_b.user_id, self.user_b.id)
        self.assertEqual(PaymentMethod.objects.filter(user=self.user_b).count(), 1)


class SoftDeleteAndReactivationTests(APITestCase):

    identifier = '4111111111111111'

    def setUp(self):
        self.user = User.objects.create_user(
            username='softuser',
            email='soft@example.com',
            password='StrongPass123',
        )
        self.client.force_authenticate(user=self.user)

    def test_deactivate_hides_method_and_same_identifier_reactivates_it(self):
        create_response = self.client.post(
            '/api/payment-methods/',
            {
                'type': 'CARD',
                'alias': 'Principal',
                'institution': 'BBVA',
                'currency': 'MXN',
                'identifier': self.identifier,
            },
            format='json',
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        method_id = create_response.data['id']

        delete_response = self.client.delete(
            f'/api/payment-methods/{method_id}/',
        )
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            delete_response.data['message'],
            'Método de pago eliminado correctamente.',
        )

        deactivated = PaymentMethod.all_objects.get(pk=method_id)
        self.assertEqual(deactivated.status, PaymentMethod.Status.INACTIVE)
        self.assertIsNotNone(deactivated.deleted_at)

        list_response = self.client.get('/api/payment-methods/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data['count'], 0)

        detail_response = self.client.get(
            f'/api/payment-methods/{method_id}/',
        )
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            detail_response.data['detail'],
            'Método de pago no encontrado.',
        )

        reactivate_response = self.client.post(
            '/api/payment-methods/',
            {
                'type': 'BANK_ACCOUNT',
                'alias': 'Nómina',
                'institution': 'Santander',
                'currency': 'USD',
                'identifier': self.identifier,
            },
            format='json',
        )

        self.assertEqual(reactivate_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reactivate_response.data['id'], method_id)
        self.assertEqual(reactivate_response.data['status'], 'ACTIVE')
        self.assertEqual(reactivate_response.data['alias'], 'Nómina')
        self.assertEqual(reactivate_response.data['institution'], 'Santander')
        self.assertEqual(reactivate_response.data['currency'], 'USD')
        self.assertEqual(reactivate_response.data['type'], 'BANK_ACCOUNT')
        self.assertEqual(PaymentMethod.all_objects.filter(user=self.user).count(), 1)

        reactivated = PaymentMethod.objects.get(pk=method_id)
        self.assertEqual(reactivated.status, PaymentMethod.Status.ACTIVE)
        self.assertIsNone(reactivated.deleted_at)
        self.assertEqual(reactivated.alias, 'Nómina')
        self.assertEqual(reactivated.institution, 'Santander')
        self.assertEqual(reactivated.currency, 'USD')
        self.assertEqual(reactivated.type, PaymentMethod.PaymentType.BANK_ACCOUNT)
