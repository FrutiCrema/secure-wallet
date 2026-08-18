from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from .models import PaymentMethod
from .serializers import PaymentMethodSerializer
from .services.payment_method_service import PaymentMethodService


class PaymentMethodListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        payment_methods = PaymentMethod.objects.filter(
            user=request.user
        ).order_by('-created_at')

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(payment_methods, request)
        serializer = PaymentMethodSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = PaymentMethodSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        try:
            payment_method = PaymentMethodService.create_payment_method(
                user=request.user,
                validated_data=serializer.validated_data.copy(),
                request=request,
            )
        except ValueError as error:
            return Response(
                {
                    'detail': str(error)
                },
                status=status.HTTP_409_CONFLICT
            )

        response_serializer = PaymentMethodSerializer(
            payment_method
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class PaymentMethodDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return PaymentMethod.objects.filter(
            user=request.user,
            pk=pk,
        ).first()

    def get(self, request, pk):
        payment_method = self.get_object(request, pk)

        if payment_method is None:
            return Response(
                {
                    'detail': 'Método de pago no encontrado.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PaymentMethodSerializer(payment_method)

        return Response(serializer.data)

    def delete(self, request, pk):
        payment_method = self.get_object(request, pk)

        if payment_method is None:
            return Response(
                {
                    'detail': 'Método de pago no encontrado.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        PaymentMethodService.deactivate_payment_method(
            payment_method=payment_method,
            user=request.user,
            request=request,
        )

        return Response(
            {
                'message': 'Método de pago eliminado correctamente.'
            },
            status=status.HTTP_200_OK
        )