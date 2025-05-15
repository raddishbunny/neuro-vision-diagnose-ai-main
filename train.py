# train.py
from keras.preprocessing.image import ImageDataGenerator
from keras.optimizers import Adam


from model import build_model

# Paths to your data directories (each class in its own subfolder)
train_dir = "path_to_training_data/"  # e.g. contains /Malaria, /Pneumonia, /Normal

# Image parameters
IMG_HEIGHT = 224
IMG_WIDTH = 224
BATCH_SIZE = 32

# Data generators with rescaling
train_datagen = ImageDataGenerator(rescale=1.0/255, validation_split=0.2)

train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)
val_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=True
)

# Build and compile the model
model = build_model()
model.compile(optimizer=Adam(),
              loss='categorical_crossentropy',
              metrics=['accuracy'])

# Train the model
epochs = 10  # or more as needed
model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=epochs
)

# Save the trained model
model.save('model.h5')
