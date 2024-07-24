from flask import Flask, request, send_file
import cv2
import numpy as np
import io

app = Flask(__name__)
@app.route('/', methods=['GET'])
def index():
    return 'Hello, World!'

@app.route('/process', methods=['POST'])
def process_image():
    # Get the image from the request
    file = request.files['image']
    in_memory_file = io.BytesIO()
    file.save(in_memory_file)
    in_memory_file.seek(0)
    file_bytes = np.asarray(bytearray(in_memory_file.read()), dtype=np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    # Process the image using OpenCV (e.g., add text)
    processed_image = process_with_opencv(image)

    # Save the processed image to a buffer
    _, buffer = cv2.imencode('.png', processed_image)
    io_buf = io.BytesIO(buffer)

    return send_file(io_buf, mimetype='image/png')

def process_with_opencv(image):
    font = cv2.FONT_HERSHEY_SIMPLEX
    text = 'Mook Bot Reply Response '
    org = (200, 500)
    font_scale = 2
    color = (0, 0, 255)
    thickness = 3
    processed_image = cv2.putText(image, text, org, font, font_scale, color, thickness, cv2.LINE_AA)
    return processed_image

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
