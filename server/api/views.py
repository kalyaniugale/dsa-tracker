from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse

def health(_request):
    return JsonResponse({"ok": True})
