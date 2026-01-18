# PDF Converter & Compressor

A modern web-based tool for converting multiple images and text files into a single, compressed PDF document with advanced customization options.

## 📋 Overview

This project is a client-side PDF converter application that allows users to:
- Upload multiple images (JPG, PNG, GIF, etc.) and text files
- Compress images before adding to PDF
- Reorder files visually with drag-and-drop
- Customize output settings (quality, page size, layout)
- Download the final PDF with significant file size reduction

## ✨ Features

### File Management
- **Multiple File Upload**: Drag & drop or browse for files
- **File Type Support**: Images (JPG, PNG, GIF, BMP) and text files
- **File Preview**: Real-time preview of images and text content
- **Smart Reordering**: Drag-and-drop interface to rearrange files
- **Selective Removal**: Remove individual or multiple selected files
- **File Limits**: Maximum 30 files or 100MB total

### Compression & Optimization
- **Intelligent Compression**: Automatic image optimization based on settings
- **Quality Control**: Adjustable compression quality (Low, Medium, High)
- **Resolution Control**: Maximum width setting for image downscaling
- **Multiple Compression Modes**: 
  - **High**: Maximum compression (smallest file size)
  - **Balanced**: Optimal balance between quality and size
  - **Low**: Minimal compression (best quality)

### PDF Customization
- **Page Size**: A4 or Letter format
- **Orientation**: Portrait or Landscape
- **Layout Options**:
  - Image fit modes: Fit, Fill, or Original size
  - Adjustable font size for text content
  - Option to add page numbers
  - File name headers for each section
- **Visual Preview**: See how files will appear in the final PDF

### Performance
- **Client-side Processing**: All conversion happens in the browser
- **Memory Management**: Handles large files with warning system
- **Progress Tracking**: Real-time conversion progress with detailed status
- **Efficient Processing**: Batch processing with minimal memory usage

## 🛠️ Technical Details

### Technologies Used
- **HTML5, CSS3, JavaScript (ES6+)**
- **PDF-Lib**: For PDF creation and manipulation
- **Canvas API**: For image compression and resizing
- **LocalStorage**: For saving user preferences
- **Drag & Drop API**: For file management and reordering

### Key Components

#### 1. File Processor (`processFiles()`)
- Validates file types and sizes
- Generates previews for images and text
- Maintains file metadata and compression status

#### 2. Image Compressor (`compressImageToBlob()`)
- Resizes images based on maximum width setting
- Applies JPEG compression with quality control
- Maintains aspect ratio during resizing

#### 3. PDF Generator (`convertToPDF()`)
- Creates multi-page PDF document
- Embeds compressed images and text content
- Applies layout settings and formatting
- Adds optional headers and page numbers

#### 4. Settings Manager
- Compression settings (quality, mode, width)
- Layout settings (page size, orientation, fit mode)
- Persistent settings via localStorage

### Compression Algorithm
1. **Image Analysis**: Determine original dimensions and file size
2. **Resolution Scaling**: Downscale images based on max width setting
3. **Quality Compression**: Apply JPEG compression with quality factor
4. **Format Optimization**: Use JPEG format for better compression ratios
5. **PDF Optimization**: Efficient embedding of compressed content

## 📁 File Structure

```
uni_convert/
├── data                # Optional: icons, fonts, etc.
├── index.html          # Main application interface
├── README.md           # This documentation
├── script/script.js    # Main application logic
└── styles/style.css    # Styling and responsive design
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+)
- JavaScript enabled
- Sufficient memory for large file processing

### Installation
1. Clone or download the project files
2. No build process required - open `index.html` directly in a browser
3. No external dependencies to install (PDF-Lib loaded from CDN)

### Usage Guide
1. **Upload Files**: Drag files into the drop zone or click "Browse"
2. **Arrange Order**: Use drag-and-drop or arrow buttons to reorder
3. **Adjust Settings**: Configure compression and layout options
4. **Preview**: Check how files will appear in the PDF
5. **Convert**: Click "Convert to PDF" to start processing
6. **Download**: Save the compressed PDF to your device

## ⚙️ Configuration

### Compression Settings
- **Quality**: 30-100% (controls JPEG compression level)
- **Max Width**: 400-4000px (limits image dimensions)
- **Compression Mode**: High, Balanced, or Low
- **Optimize Images**: Enable/disable image compression

### Layout Settings
- **Page Size**: A4 (210×297mm) or Letter (216×279mm)
- **Orientation**: Portrait or Landscape
- **Image Fit**: Fit, Fill, or Original
- **Font Size**: 8-24pt for text content
- **Page Numbers**: Add page numbers to each page
- **File Headers**: Add file names as section headers

## 📊 Performance Metrics

### Typical Compression Results
- **High Compression**: 70-90% size reduction for images
- **Balanced**: 50-70% size reduction
- **Low Compression**: 20-40% size reduction
- **Text Files**: Minimal size increase when converted to PDF

### File Size Limits
- **Individual Files**: ≤ 15MB
- **Total Upload**: ≤ 100MB
- **Maximum Files**: 30 files per session
- **Memory Warning**: Displayed for files > 5MB

## 🔧 Development

### Code Architecture
The application follows a modular design pattern:

```javascript
// Core modules
- FileManager: Handles file uploads and management
- Compressor: Image compression and optimization
- PDFBuilder: PDF document creation
- UIManager: User interface updates
- Settings: Configuration management
```

### Key Functions
- `init()`: Application initialization
- `processFiles()`: File validation and processing
- `compressImageToBlob()`: Image compression
- `convertToPDF()`: Main conversion logic
- `updateStats()`: Real-time statistics calculation

### Extending the Project

#### Adding New Features
1. **New File Types**: Extend `processFiles()` to support additional formats
2. **Advanced Compression**: Implement different compression algorithms
3. **Cloud Integration**: Add cloud storage upload/download
4. **Batch Processing**: Implement queue system for large batches

#### Code Guidelines
- Use descriptive variable and function names
- Add comments for complex logic
- Maintain consistent code style
- Handle all potential errors gracefully
- Optimize for memory usage with large files

## 🧪 Testing

### Test Scenarios
1. **File Upload**: Test with various file types and sizes
2. **Compression**: Verify size reduction meets expectations
3. **PDF Generation**: Ensure PDF is properly formatted
4. **Memory Handling**: Test with large files (10MB+)
5. **Browser Compatibility**: Test across different browsers

### Common Issues & Solutions
1. **Large Files Crash Browser**: Implement chunked processing
2. **Memory Leaks**: Ensure proper cleanup of Blob URLs
3. **Slow Processing**: Add progress indicators and background processing
4. **PDF Quality Issues**: Adjust compression settings balance

## 📈 Optimization Tips

### For Best Results
1. **Use High Compression Mode** for maximum size reduction
2. **Set Max Width to 1200px** for optimal quality/size balance
3. **Combine Similar Files** for consistent appearance
4. **Enable Image Optimization** for significant size savings
5. **Use JPEG Format** for photographs before uploading

### Performance Optimization
- Process files sequentially to avoid memory spikes
- Use web workers for intensive compression tasks
- Implement lazy loading for file previews
- Clean up temporary objects after processing

## 🤝 Contributing

### Development by Habibullah
This project was developed by **Habibullah** as part of a class project demonstrating:
- Modern JavaScript techniques
- Client-side file processing
- PDF manipulation and generation
- Responsive web design principles
- Performance optimization strategies

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Implement improvements
4. Test thoroughly
5. Submit a pull request

### Areas for Improvement
- Add support for more file formats (Word, Excel, etc.)
- Implement server-side processing option
- Add PDF editing capabilities
- Create browser extension version
- Add collaborative features

## 📄 License

This project is developed for educational purposes as part of a class project.

### Usage Rights
- Free for personal and educational use
- Modification allowed with credit to original author
- Commercial use requires permission

## 🙏 Acknowledgments

- **PDF-Lib** team for the excellent PDF manipulation library
- **Modern Browser APIs** that enable client-side file processing
- **Class Instructors** for guidance and support
- **Test Users** for valuable feedback and bug reports

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify file types and sizes are within limits
3. Try different compression settings
4. Clear browser cache and localStorage if needed

---

**Note**: This application processes files entirely in your browser. No files are uploaded to any server, ensuring complete privacy and security of your documents.

**Last Updated**: Jan-2026  
**Version**: 1.0.0  
**Developer**: Habibullah