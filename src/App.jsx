import React, { useState, useRef, useEffect } from 'react';
import { Upload, Mic, Download, FileText, Save, ZoomIn, ZoomOut, RotateCcw, Image } from 'lucide-react';
import * as XLSX from 'xlsx';

const XHTMLFormTransformer = () => {
  const [originalContent, setOriginalContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isVoiceReady, setIsVoiceReady] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [uploadedImages, setUploadedImages] = useState({});
  const formContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentEditableRef = useRef(null);
  const editableSetupDone = useRef(new Set());

   // 🧠 Connects to backend /api/voice-agent
  const aiVoiceAgent = async (transcript) => {
    try {
      const res = await fetch("http://localhost:3001/api/voice-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();
      console.log("🤖 AI response:", data);
      return data;
    } catch (err) {
      console.error("AI request failed:", err);
      return { action: "replace", value: transcript, confidence: 0.5, type: "text" };
    }
  };

  useEffect(() => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (!currentEditableRef.current) return;
      const target = currentEditableRef.current;

      // 🔹 Call AI agent for interpretation
      const result = await aiVoiceAgent(transcript);

      console.log("AI result:", result);

      // 🔹 Apply AI action
      if (result && result.confidence > 0.5) {
        switch (result.action) {
          case "replace":
            target.textContent = result.value;
            break;
          case "append":
            target.textContent = (target.textContent + " " + result.value).trim();
            break;
          case "clear":
            target.textContent = "";
            break;
          default:
            // noop or unknown
            break;
        }

        // visual feedback
        target.style.backgroundColor = "#e9ffe9";
        setTimeout(() => {
          target.style.backgroundColor = "";
        }, 800);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    setIsVoiceReady(true);
  }
}, []);

  const shouldMakeEditable = (element) => {
    const text = element.textContent || '';

    const patterns = [
      /_{3,}/,
      /\.{3,}/,
      /\(enter\)/gi,
      /\(fill\)/gi,
      /\(input\)/gi,
      /\(image\)/gi,
      /\(logo\)/gi,
      /\(photo\)/gi,
      /\[.*?\]/,
      /^\s*$/
    ];

    return patterns.some(pattern => pattern.test(text));
  };

  const makeElementEditable = (element, originalText) => {
    const elementId = element.getAttribute('data-editable-id');
    if (elementId && editableSetupDone.current.has(elementId)) {
      return;
    }

    const uniqueId = `editable-${Date.now()}-${Math.random()}`;
    element.setAttribute('data-editable-id', uniqueId);
    editableSetupDone.current.add(uniqueId);

    element.contentEditable = 'true';
    element.classList.add('editable');
    element.setAttribute('data-original', originalText);
    
    if (!element.style.minWidth) element.style.minWidth = '50px';
    if (!element.style.minHeight) element.style.minHeight = '20px';
    if (!element.style.cursor) element.style.cursor = 'text';
    
    let cleanedText = originalText
      .replace(/_{3,}/g, '')
      .replace(/\.{3,}/g, '')
      .replace(/\(enter\)/gi, '')
      .replace(/\(fill\)/gi, '')
      .replace(/\(input\)/gi, '')
      .replace(/\(image\)/gi, '')
      .replace(/\(logo\)/gi, '')
      .replace(/\(photo\)/gi, '')
      .replace(/\[.*?\]/g, '');
    
    element.textContent = cleanedText.trim() || '';

    const handleFocus = function() {
      this.style.outline = '2px solid #00aaff';
      this.style.backgroundColor = '#e6f7ff';
    };

    const handleBlur = function() {
      this.style.outline = '';
      this.style.backgroundColor = '';
    };

    const handleDblClick = function(e) {
      e.stopPropagation();
      if (isVoiceReady && recognitionRef.current) {
        currentEditableRef.current = this;
        try {
          recognitionRef.current.start();
          this.style.border = '2px dashed #ff6b6b';
          setTimeout(() => {
            this.style.border = '';
          }, 3000);
        } catch (err) {
          console.error('Voice input error:', err);
        }
      }
    };

    // Right-click to add image
    const handleContextMenu = function(e) {
      e.preventDefault();
      currentEditableRef.current = this;
      imageInputRef.current?.click();
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);
    element.addEventListener('dblclick', handleDblClick);
    element.addEventListener('contextmenu', handleContextMenu);
  };

  const processImages = (container) => {
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
      if (img.src.startsWith('data:')) {
        return;
      }

      img.onerror = function() {
        this.style.border = '2px dashed #ccc';
        this.style.backgroundColor = '#f5f5f5';
        this.style.display = 'inline-block';
        this.alt = this.alt || 'Image placeholder - Right-click to add';
        this.style.minWidth = '100px';
        this.style.minHeight = '100px';
      };

      if (!img.style.maxWidth) {
        img.style.maxWidth = '100%';
      }
      if (!img.style.height && !img.height) {
        img.style.height = 'auto';
      }

      // Make images clickable to replace
      img.style.cursor = 'pointer';
      img.addEventListener('click', function() {
        currentEditableRef.current = this;
        imageInputRef.current?.click();
      });
    });
  };

  const transformToEditable = (container) => {
    processImages(container);

    const priority = ['td', 'th', 'p', 'span', 'div'];
    const processed = new Set();

    priority.forEach(tag => {
      const elements = container.querySelectorAll(tag);
      
      elements.forEach(element => {
        if (processed.has(element) || element.classList.contains('editable')) {
          return;
        }

        if (element.querySelector('img')) {
          return;
        }

        const hasChildElements = priority.some(t => {
          if (t === tag) return false;
          return element.querySelector(t) !== null;
        });

        if (hasChildElements) {
          return;
        }

        if (element.querySelector('table, tr')) {
          return;
        }

        const originalText = element.textContent || '';
        
        if (tag === 'td' || tag === 'th') {
          if (originalText.trim() === '' || shouldMakeEditable(element)) {
            makeElementEditable(element, originalText);
            processed.add(element);
          }
        } 
        else if (shouldMakeEditable(element)) {
          makeElementEditable(element, originalText);
          processed.add(element);
        }
      });
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    editableSetupDone.current.clear();
    setFileName(file.name);
    let text = await file.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    
    const images = doc.querySelectorAll('img[src]');
    for (const img of images) {
      const src = img.getAttribute('src');
      if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
        continue;
      }
    }

    text = doc.documentElement.outerHTML;
    setOriginalContent(text);

    setTimeout(() => {
      if (formContainerRef.current) {
        transformToEditable(formContainerRef.current);
      }
    }, 100);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentEditableRef.current) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const target = currentEditableRef.current;

      if (target.tagName === 'IMG') {
        // Replace image source
        target.src = dataUrl;
        target.alt = file.name;
      } else {
        // Insert image into editable field
        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = file.name;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '10px 0';
        
        target.innerHTML = '';
        target.appendChild(img);
        target.contentEditable = 'false';
        target.style.cursor = 'pointer';
        
        // Allow re-clicking to change image
        target.addEventListener('click', function() {
          currentEditableRef.current = this;
          imageInputRef.current?.click();
        });
      }

      // Store for export
      setUploadedImages(prev => ({
        ...prev,
        [target.getAttribute('data-editable-id') || Math.random()]: dataUrl
      }));
    };

    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const exportToXLSX = () => {
    if (!formContainerRef.current) return;

    const tables = formContainerRef.current.querySelectorAll('table');
    const workbook = XLSX.utils.book_new();

    if (tables.length > 0) {
      tables.forEach((table, index) => {
        const worksheet = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Sheet${index + 1}`);
      });
    } else {
      const data = [];
      const editables = formContainerRef.current.querySelectorAll('.editable');
      editables.forEach((el, i) => {
        data.push({ Field: i + 1, Value: el.textContent.trim() });
      });
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'FormData');
    }

    XLSX.writeFile(workbook, fileName.replace(/\.(x?html?)$/, '_filled.xlsx') || 'form_filled.xlsx');
  };

  const exportToPDF = () => {
    const printContent = formContainerRef.current.cloneNode(true);
    
    printContent.querySelectorAll('.editable').forEach(el => {
      el.contentEditable = 'false';
      el.style.outline = 'none';
      el.style.backgroundColor = 'transparent';
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${fileName || 'Form'}</title>
        <style>
          body { margin: 20px; font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          .editable { border: none !important; outline: none !important; }
          img { max-width: 100%; height: auto; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const exportToHTML = () => {
    if (!formContainerRef.current) return;
    
    const content = formContainerRef.current.cloneNode(true);
    
    content.querySelectorAll('.editable').forEach(el => {
      el.contentEditable = 'false';
      el.classList.remove('editable');
    });

    const htmlOutput = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fileName || 'Form'}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { border-collapse: collapse; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${content.innerHTML}
</body>
</html>`;
    
    const blob = new Blob([htmlOutput], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.(x?html?)$/, '_filled.html') || 'form_filled.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-full px-4 py-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm font-medium text-sm"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.xhtml,.htm"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {fileName && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-100 rounded-lg">
                  <FileText size={14} className="text-gray-600" />
                  <span className="text-xs font-medium text-gray-700 truncate max-w-[150px]">{fileName}</span>
                </div>
              )}
            </div>

            {originalContent && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border-r pr-2">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} className="text-gray-600" />
                  </button>
                  <span className="text-xs font-medium text-gray-600 min-w-[45px] text-center">
                    {zoom}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={16} className="text-gray-600" />
                  </button>
                </div>

                {isVoiceReady && (
                  <div className="hidden md:flex items-center gap-1.5 px-2 py-1.5 bg-purple-50 rounded-lg">
                    <Mic size={14} className="text-purple-600" />
                    <span className="text-xs text-purple-700 font-medium">Voice: Dbl-click</span>
                  </div>
                )}

                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 bg-orange-50 rounded-lg">
                  <Image size={14} className="text-orange-600" />
                  <span className="text-xs text-orange-700 font-medium">Image: Right-click</span>
                </div>
                
                <button
                  onClick={exportToHTML}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm text-sm"
                  title="Export as HTML"
                >
                  <Save size={14} />
                  <span className="hidden sm:inline">HTML</span>
                </button>

                <button
                  onClick={exportToXLSX}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm text-sm"
                  title="Export as Excel"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">XLSX</span>
                </button>

                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm text-sm"
                  title="Print/Save as PDF"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-full px-4 py-6 overflow-x-auto">
        {!originalContent ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <Upload size={64} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Transform Your Form
              </h2>
              <p className="text-gray-500 mb-6 text-base">
                Upload an XHTML or HTML form. Fields will be auto-detected and made editable.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-medium"
              >
                Choose File
              </button>
              <div className="mt-6 space-y-2 text-xs text-gray-500">
                <p>✓ Double-click fields for voice input</p>
                <p>✓ Right-click to add images/logos</p>
                <p>✓ Use zoom controls for easier navigation</p>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="bg-white shadow-xl rounded-lg overflow-auto"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
              minHeight: '500px'
            }}
          >
            <div
              ref={formContainerRef}
              dangerouslySetInnerHTML={{ __html: originalContent }}
              className="p-6 form-container"
              style={{
                fontSize: `${Math.max(12, 16 * (zoom / 100))}px`
              }}
            />
          </div>
        )}
      </div>

      {originalContent && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs max-w-[200px] sm:hidden">
          💡 Tap zoom buttons above for better control
        </div>
      )}

      <style>{`
        .editable {
          cursor: text !important;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .editable:focus {
          outline: 2px solid #00aaff !important;
          background-color: #e6f7ff !important;
          z-index: 10;
        }
        
        .editable:hover {
          background-color: #f0f9ff;
        }
        
        .form-container table {
          border-collapse: collapse;
        }
        
        .form-container img {
          max-width: 100%;
          height: auto;
          display: inline-block;
        }
        
        .form-container img:hover {
          opacity: 0.8;
          outline: 2px dashed #00aaff;
        }
        
        @media print {
          .print\\:hidden { display: none !important; }
          .editable {
            outline: none !important;
            background-color: transparent !important;
            border: none !important;
          }
        }

        @media (max-width: 640px) {
          .editable {
            min-height: 40px !important;
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default XHTMLFormTransformer;
