#!/bin/bash

echo "步驟1：轉換 SVG 為 PNG"
python3 svg.py

echo "步驟2：縮放 PNG 為 192x192"
python3 pil.py
