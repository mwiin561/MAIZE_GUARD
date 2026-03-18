const tf = require('@tensorflow/tfjs');
const tflite = require('@tensorflow/tfjs-tflite');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function runTest() {
    const IMAGE_PATH = path.join(__dirname, 'public', 'uploads', 'scan-1773743566985.jpg');
    const MODEL_PATH = path.join(__dirname, 'public', 'models', 'v2', 'model.tflite');

    console.log(`📁 Testing with image: ${IMAGE_PATH}`);
    console.log(`🧠 Testing TFLite model: ${MODEL_PATH}`);

    if (!fs.existsSync(IMAGE_PATH)) {
        console.error('❌ Image not found!');
        return;
    }
    if (!fs.existsSync(MODEL_PATH)) {
        console.error('❌ Model not found!');
        return;
    }

    try {
        // 1. Load and Preprocess Image with Jimp (Golden Recipe: Bilinear, No Norm)
        console.log('🖼️  Preprocessing image with Jimp...');
        const jimpImage = await Jimp.read(IMAGE_PATH);
        jimpImage.resize(224, 224, Jimp.RESIZE_BILINEAR);
        
        const { data, width, height } = jimpImage.bitmap;
        const buffer = new Float32Array(width * height * 3);
        
        // Convert to RGB Float32 [0, 1]
        for (let i = 0; i < width * height; i++) {
            buffer[i * 3 + 0] = data[i * 4 + 0] / 255.0; // R
            buffer[i * 3 + 1] = data[i * 4 + 1] / 255.0; // G
            buffer[i * 3 + 2] = data[i * 4 + 2] / 255.0; // B
        }
        
        const inputTensor = tf.tensor3d(buffer, [height, width, 3]).expandDims(0);

        // 2. Load TFLite Model
        console.log('🚀 Loading TFLite model...');
        const model = await tflite.loadTFLiteModel(MODEL_PATH);
        
        console.log('🔮 Running inference...');
        const output = model.predict(inputTensor);
        const predictions = await output.data();

        console.log('\n--- TFLite Results ---');
        const scores = Array.from(predictions);
        const win = scores.indexOf(Math.max(...scores));
        const conf = scores[win];
        const labels = ["Healthy", "MSV", "Unknown"];

        console.log(`Result: Class ${win}, Conf: ${conf.toFixed(4)}`);
        console.log(`Scores: [${scores.join(', ')}]`);
        console.log(`Diagnosis: {${labels[win]}}`);
        
        console.log('\n--- Comparison with PyTorch Gold Standard ---');
        console.log('PT Result: Class 1, Conf: 1.0000, Diagnosis: MSV');
        
        if (win === 1 && conf > 0.8) {
            console.log('✅ MATCH! The TFLite model is accurate and "the shoe fits".');
        } else {
            console.log('⚠️ DISCREPANCY! TFLite results differ from PyTorch.');
        }

    } catch (e) {
        console.error('❌ Error during verification:', e.stack || e.message);
    }
}

runTest();
