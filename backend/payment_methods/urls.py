from django.urls import path

from .views import (
    PaymentMethodDetailView,
    PaymentMethodListCreateView,
)


urlpatterns = [
    path(
        '',
        PaymentMethodListCreateView.as_view(),
        name='payment-method-list-create',
    ),
    path(
        '<int:pk>/',
        PaymentMethodDetailView.as_view(),
        name='payment-method-detail',
    ),
]