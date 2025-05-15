import os
import shutil
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from sklearn.model_selection import train_test_split

# Paths
DATASET_DIR = "dataset"
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10

# Split data into train and val (only once)
def split_dataset():
    if os.path.exists("data/train"):
        return  # Already split

    os.makedirs("data/train", exist_ok=True)
    os.makedirs("data/val", exist_ok=True)

    for cls in os.listdir(DATASET_DIR):
        cls_path = os.path.join(DATASET_DIR, cls)
        if not os.path.isdir(cls_path):
            continue

        images = os.listdir(cls_path)
        train_imgs, val_imgs = train_test_split(images, test_size=0.2, random_state=42)

        os.makedirs(f"data/train/{cls}", exist_ok=True)
        os.makedirs(f"data/val/{cls}", exist_ok=True)

        for img in train_imgs:
            shutil.copy(os.path.join(cls_path, img), f"data/train/{cls}/{img}")
        for img in val_imgs:
            shutil.copy(os.path.join(cls_path, img), f"data/val/{cls}/{img}")

# Call split
split_dataset()

# Image augmentation and data loading
train_datagen = ImageDataGenerator(rescale=1./255)
val_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    'data/train',
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

val_generator = val_datagen.flow_from_directory(
    'data/val',
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

# Print classes for verification
print("Class indices:", train_generator.class_indices)

# Model definition
model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
    MaxPooling2D(2, 2),
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),
    Flatten(),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(4, activation='softmax')  # 4 classes
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Train the model
model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS
)

# Save model
model.save("model.h5")
