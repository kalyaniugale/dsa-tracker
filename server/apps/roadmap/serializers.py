from rest_framework import serializers
from .models import Track, TrackProblem
from apps.problems.models import Problem

class ProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Problem
        fields = ['id', 'title', 'difficulty']

class TrackProblemSerializer(serializers.ModelSerializer):
    problem = ProblemSerializer(read_only=True)

    class Meta:
        model = TrackProblem
        fields = ['order', 'problem']

class TrackSerializer(serializers.ModelSerializer):
    track_problems = TrackProblemSerializer(many=True, read_only=True)

    class Meta:
        model = Track
        fields = ['id', 'name', 'description', 'slug', 'track_problems']
