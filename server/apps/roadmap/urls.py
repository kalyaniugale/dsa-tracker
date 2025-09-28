from django.urls import path
from .views import (
  TrackListAPIView, TrackDetailAPIView, TrackCreateAPIView, TrackUpdateAPIView,SuggestNextAPIView, TrackBulkAttachAPIView
)

urlpatterns = [
    path('tracks/', TrackListAPIView.as_view(), name='track-list'),
    path('tracks/<int:pk>/', TrackDetailAPIView.as_view(), name='track-detail'),
    path('tracks/create/', TrackCreateAPIView.as_view(), name='track-create'),
    path('tracks/<int:pk>/update/', TrackUpdateAPIView.as_view(), name='track-update'),
    path('tracks/<int:pk>/suggest-next/', SuggestNextAPIView.as_view(), name='track-suggest-next'),
    path('tracks/<int:pk>/attach/', TrackBulkAttachAPIView.as_view(), name='track-attach'),

]