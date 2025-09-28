from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Prefetch

from .models import Track, TrackProblem
from .serializers import TrackSerializer

base_qs = Track.objects.prefetch_related(
    Prefetch('track_problems',
             queryset=TrackProblem.objects.select_related('problem').order_by('order'))
)

class TrackListAPIView(generics.ListAPIView):
    queryset = base_qs
    serializer_class = TrackSerializer
    pagination_class = None

class TrackDetailAPIView(generics.RetrieveAPIView):
    queryset = base_qs
    serializer_class = TrackSerializer

class TrackCreateAPIView(generics.CreateAPIView):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [permissions.IsAdminUser]

class TrackUpdateAPIView(generics.UpdateAPIView):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [permissions.IsAdminUser]

class TrackBulkAttachAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def post(self, request, pk):
        ids = request.data.get("problem_ids", [])
        TrackProblem.objects.filter(track_id=pk).delete()
        TrackProblem.objects.bulk_create([
            TrackProblem(track_id=pk, problem_id=pid, order=i+1)
            for i, pid in enumerate(ids)
        ])
        return Response({"attached": len(ids)}, status=status.HTTP_201_CREATED)

class SuggestNextAPIView(APIView):
    def get(self, request, pk):
        completed = request.query_params.get('completed', '')
        done_ids = {int(x) for x in completed.split(',') if x.isdigit()}
        tp = (TrackProblem.objects
              .filter(track_id=pk)
              .exclude(problem_id__in=done_ids)
              .select_related('problem')
              .order_by('order')
              .first())
        if not tp:
            return Response({"next": None})
        return Response({"next": {"id": tp.problem_id, "title": tp.problem.title, "order": tp.order}})
