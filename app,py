from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os
import uuid
from PIL import Image
import cv2

app = Flask(__name__)
CORS(app)

# Load the trained model (ensure this model was trained for 3 classes: malaria, pneumonia, normal)
MODEL_PATH = "model.h5"
model = load_model(MODEL_PATH)

# Class labels (make sure they match your training)
CLASS_LABELS = ['malaria', 'normal', 'pneumonia']

# Image preprocessing
def preprocess_image(img):
    img = img.resize((224, 224))
    img = image.img_to_array(img)
    img = img / 255.0
    img = np.expand_dims(img, axis=0)
    return img

# Dummy Grad-CAM generator (replace with actual Grad-CAM if needed)
def generate_dummy_gradcam(disease, result):
    return f"/static/{disease}_{result}_gradcam.png"

@app.route("/predict", methods=["POST"])
def predict():
    if 'file' not in request.files or 'disease' not in request.form:
        return jsonify({"error": "Missing file or disease field"}), 400

    file = request.files['file']
    disease_type = request.form['disease'].lower()  # "malaria" or "pneumonia"

    try:
        img = Image.open(file.stream).convert("RGB")
        processed_img = preprocess_image(img)
        prediction = model.predict(processed_img)[0]
        predicted_class_idx = np.argmax(prediction)
        confidence = float(np.max(prediction)) * 100
        predicted_label = CLASS_LABELS[predicted_class_idx]

        # Determine result (positive, negative, or pending)
        if predicted_label == "normal":
            result = "negative"
        elif predicted_label == disease_type:
            result = "positive"
        else:
            result = "negative"

        gradcam_url = generate_dummy_gradcam(disease_type, result)

        return jsonify({
            "disease": disease_type,
            "result": result,
            "confidence": round(confidence, 2),
            "gradCamUrl": gradcam_url
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
