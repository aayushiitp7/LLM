"""
Vercel Serverless Function Entrypoint
"""

import sys
import os

# Add the backend directory to the Python path so imports work correctly
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app

# Vercel requires the variable to be named 'app'
