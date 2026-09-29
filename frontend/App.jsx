import { useRef, useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Check,
  CircleCheck,
  Clock3,
  FileImage,
  ScanLine,
} from 'lucide-react'
import {
  DetectionPanel,
  DetectionResult,
  DemoSamples,
  Footer,
  Hero,
  HowItWorks,
  Methodology,
  Navbar,
  ProcessingPipeline,
  ResearchResults,
} from './components.jsx'

const DEMO_SAMPLES = [
  {
    id: 'sample-1',
    label: 'City sedan',
    plate: 'MH 43 AB 1234',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85',
    imageName: 'city-sedan.jpg',
  },
  {
    id: 'sample-2',
    label: 'Roadster',
    plate: 'MH 01 CD 5678',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
    imageName: 'roadster.jpg',
  },
  {
    id: 'sample-3',
    label: 'Classic coupe',
    plate: 'KA 05 MN 2468',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=85',
    imageName: 'classic-coupe.jpg',
  },
  {
    id: 'sample-4',
    label: 'Electric sedan',
    plate: 'DL 03 XY 9012',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=85',
    imageName: 'electric-sedan.jpg',
  },
]

const PROCESS_STEPS = [
  'Preprocessing image...',
  'Detecting number plate...',
  'Cropping plate...',
  'Running OCR...',
  'Recognition complete',
]

function readHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem('anpr-vision-history') || '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function makePlateCrop(imageUrl) {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        const crop = {
          x: Math.round(image.naturalWidth * 0.43),
          y: Math.round(image.naturalHeight * 0.61),
          width: Math.round(image.naturalWidth * 0.36),
          height: Math.round(image.naturalHeight * 0.14),
        }
        canvas.width = 720
        canvas.height = 220
        context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      } catch {
        resolve(null)
      }
    }
    image.onerror = () => resolve(null)
    image.src = imageUrl
  })
}

export default function App() {
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [cropPreview, setCropPreview] = useState(null)
  const [processingStep, setProcessingStep] = useState(-1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [history, setHistory] = useState(readHistory)
  const runToken = useRef(0)

  function clearImage() {
    runToken.current += 1
    if (image?.isObjectUrl) URL.revokeObjectURL(image.url)
    setImage(null)
    setResult(null)
    setCropPreview(null)
    setProcessingStep(-1)
    setIsProcessing(false)
  }

  function selectFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    clearImage()
    const url = URL.createObjectURL(file)
    setImage({ url, name: file.name, sample: null, isObjectUrl: true })
  }

  async function runDetection(imageToProcess = image) {
    if (!imageToProcess || (isProcessing && imageToProcess === image)) return
    const token = ++runToken.current
    setIsProcessing(true)
    setResult(null)
    setCropPreview(null)
    setProcessingStep(0)

    for (let step = 0; step < PROCESS_STEPS.length; step += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 620))
      if (token !== runToken.current) return
      setProcessingStep(step)
    }

    const plate = imageToProcess.sample?.plate || `DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const confidence = imageToProcess.sample ? 96 : 91
    const newResult = {
      plate,
      confidence,
      status: 'Detected',
      quality: 'Good',
      imageName: imageToProcess.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString(),
      recognition: imageToProcess.sample ? 'Demo sample result' : 'Simulated recognition',
    }
    const crop = await makePlateCrop(imageToProcess.url)
    if (token !== runToken.current) return
    setCropPreview(crop)
    setResult(newResult)
    setIsProcessing(false)
    setProcessingStep(PROCESS_STEPS.length - 1)
    setHistory((previous) => {
      const updated = [newResult, ...previous].slice(0, 12)
      try {
        localStorage.setItem('anpr-vision-history', JSON.stringify(updated))
      } catch {
        // The current session still keeps history if browser storage is unavailable.
      }
      return updated
    })
    window.setTimeout(() => {
      if (token === runToken.current) setProcessingStep(-1)
    }, 1800)
  }

  function selectSample(sample) {
    clearImage()
    const selected = { url: sample.image, name: sample.imageName, sample, isObjectUrl: false }
    setImage(selected)
    runDetection(selected)
  }

  function exportResult(format) {
    if (!result) return
    const content = format === 'json'
      ? JSON.stringify({ ...result, mode: 'frontend demo', simulated: true }, null, 2)
      : [
          'ANPR Vision - Demo Result',
          `Plate: ${result.plate}`,
          `Confidence: ${result.confidence}%`,
          `Status: ${result.status}`,
          `Image: ${result.imageName}`,
          `Processed: ${result.date}`,
          'Recognition is simulated; no production model was used.',
        ].join('\n')
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `anpr-demo-result.${format}`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero onDetect={() => document.getElementById('detection')?.scrollIntoView({ behavior: 'smooth' })} />

        <section className="workspace section-wrap" id="detection">
          <div className="section-heading detection-heading">
            <div>
              <span className="eyebrow"><span className="live-dot" /> INTERACTIVE WORKSPACE</span>
              <h2>Number plate detection</h2>
              <p>Upload a vehicle image to simulate the ANPR detection pipeline.</p>
            </div>
            <div className={`system-status ${isProcessing ? 'status-processing' : result ? 'status-complete' : ''}`}>
              {isProcessing ? <Activity size={15} /> : result ? <CircleCheck size={15} /> : <span className="ready-dot" />}
              {isProcessing ? 'Processing' : result ? 'Complete' : 'Ready'}
            </div>
          </div>

          <DetectionPanel
            image={image}
            result={result}
            processingStep={processingStep}
            isProcessing={isProcessing}
            steps={PROCESS_STEPS}
            onFile={selectFile}
            onClear={clearImage}
            onRun={() => runDetection()}
          />

          {result && !isProcessing && (
            <DetectionResult
              result={result}
              cropPreview={cropPreview}
              onRunAgain={() => runDetection()}
              onClear={clearImage}
              onExport={(format) => exportResult(format)}
            />
          )}

          <DemoSamples samples={DEMO_SAMPLES} onSelect={selectSample} />
          <HistoryPanel history={history} />
        </section>

        <ProcessingPipeline />
        <HowItWorks />
        <Methodology />
        <ResearchResults />
        <AboutResearch />
      </main>
      <Footer />
    </>
  )
}

function HistoryPanel({ history }) {
  return (
    <section className="history-panel" aria-labelledby="history-title">
      <div className="history-heading">
        <div>
          <span className="eyebrow">LOCAL SESSION</span>
          <h3 id="history-title">Detection history</h3>
        </div>
        <span className="history-count">{history.length} records</span>
      </div>
      {history.length === 0 ? (
        <div className="history-empty"><Clock3 size={19} /><span>Your recent demo detections will appear here.</span></div>
      ) : (
        <div className="history-list">
          {history.map((entry, index) => (
            <div className="history-row" key={`${entry.date}-${index}`}>
              <span className="history-icon"><FileImage size={16} /></span>
              <span className="history-file"><strong>{entry.imageName}</strong><small>{entry.time}</small></span>
              <span className="history-plate">{entry.plate}</span>
              <span className="history-confidence">{entry.confidence}%</span>
              <span className="history-detected"><Check size={13} /> {entry.status}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AboutResearch() {
  const useCases = ['Vehicle identification', 'Parking management', 'Traffic monitoring', 'Security monitoring', 'Access control']
  return (
    <section className="about-section section-wrap" id="about">
      <div className="about-mark"><ScanLine size={24} /></div>
      <div className="about-copy">
        <span className="eyebrow">ABOUT THE RESEARCH</span>
        <h2>Automatic Number Plate Detection using Deep Learning</h2>
        <p>Automatic number plate recognition (ANPR) is a computer-vision workflow used to locate and recognize vehicle registration plates from images. This prototype presents the research process as an interactive, browser-based demonstration.</p>
        <div className="use-cases">{useCases.map((item) => <span key={item}>{item}</span>)}</div>
      </div>
      <a className="about-link" href="#methodology" aria-label="Read the methodology"><ArrowDown size={19} /></a>
    </section>
  )
}