import { useState } from "react"

const SYMPTOMS = [
  "Headache", "Fever", "Sore throat", "Cough", "Fatigue",
  "Nausea", "Vomiting", "Diarrhea", "Chest pain", "Shortness of breath",
  "Dizziness", "Rash", "Muscle pain", "Joint pain", "Runny nose"
]

export default function App() {
  const [step, setStep] = useState("form")
  const [form, setForm] = useState({
    age: "",
    gender: "male",
    symptoms: [],
    duration: "1-3 days",
    severity: "mild",
    extra_info: ""
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  const toggleSymptom = (symptom) => {
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }))
  }

  const handleAnalyze = async () => {
    if (!form.age || form.symptoms.length === 0) {
      alert("Please enter your age and select at least one symptom.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: parseInt(form.age) })
      })
      const data = await res.json()
      setResult(data)
      setStep("results")
    } catch (err) {
      alert("Error connecting to API. Make sure the backend is running.")
    }
    setLoading(false)
  }

  const handleChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = { role: "user", content: chatInput }
    const newHistory = [...chatMessages, userMsg]
    setChatMessages(newHistory)
    setChatInput("")
    setChatLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput,
          history: chatMessages,
          symptom_context: form.symptoms.join(", ")
        })
      })
      const data = await res.json()
      setChatMessages([...newHistory, { role: "assistant", content: data.response }])
    } catch (err) {
      alert("Error connecting to API.")
    }
    setChatLoading(false)
  }

  const actionColor = {
    "Rest at home": "bg-green-900 border-green-500 text-green-300",
    "See a doctor soon": "bg-yellow-900 border-yellow-500 text-yellow-300",
    "Seek immediate medical attention": "bg-red-900 border-red-500 text-red-300"
  }

  const likelihoodColor = {
    "High": "bg-red-900 text-red-300",
    "Medium": "bg-yellow-900 text-yellow-300",
    "Low": "bg-green-900 text-green-300"
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">🩺 SymptomSense</h1>
          <p className="text-gray-400 mt-2">AI-powered symptom checker — not a substitute for medical advice</p>
        </div>

        {/* FORM */}
        {step === "form" && (
          <div className="bg-gray-900 rounded-2xl shadow p-6 space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Age</label>
                <input type="number" placeholder="e.g. 25"
                  value={form.age}
                  onChange={e => setForm({ ...form, age: e.target.value })}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Gender</label>
                <select value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400">Symptoms (select all that apply)</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SYMPTOMS.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      form.symptoms.includes(s)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-800 text-gray-400 border-gray-600 hover:border-blue-500"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400">Any other symptoms?</label>
              <input type="text" placeholder="e.g. eye pain, sensitivity to light"
                value={form.extra_info}
                onChange={e => setForm({ ...form, extra_info: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white placeholder-gray-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Duration</label>
                <select value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white">
                  <option>Less than 1 day</option>
                  <option>1-3 days</option>
                  <option>4-7 days</option>
                  <option>1-2 weeks</option>
                  <option>More than 2 weeks</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Severity</label>
                <select value={form.severity}
                  onChange={e => setForm({ ...form, severity: e.target.value })}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white">
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>

            <button onClick={handleAnalyze}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition">
              {loading ? "Analyzing..." : "Analyze Symptoms"}
            </button>
          </div>
        )}

        {/* RESULTS */}
        {step === "results" && result && (
          <div className="space-y-4">

            <div className={`border-2 rounded-2xl p-4 text-center font-semibold text-lg ${actionColor[result.recommended_action] || "bg-gray-800 border-gray-600 text-gray-300"}`}>
              {result.recommended_action}
            </div>

            <div className="bg-gray-900 rounded-2xl shadow p-5 space-y-3">
              <h2 className="font-bold text-white text-lg">Possible Conditions</h2>
              {result.conditions.map((c, i) => (
                <div key={i} className="border border-gray-700 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${likelihoodColor[c.likelihood] || "bg-gray-800 text-gray-400"}`}>
                      {c.likelihood} likelihood
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{c.explanation}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 rounded-2xl shadow p-5">
              <h2 className="font-bold text-white text-lg mb-2">Self-Care Tips</h2>
              <ul className="space-y-1">
                {result.self_care_tips.map((tip, i) => (
                  <li key={i} className="text-gray-400 text-sm flex gap-2">
                    <span className="text-green-400">✓</span> {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-950 border border-yellow-700 rounded-xl p-3 text-yellow-300 text-sm">
              ⚠️ {result.disclaimer}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setStep("form"); setResult(null); setForm({ age: "", gender: "male", symptoms: [], duration: "1-3 days", severity: "mild", extra_info: "" }) }}
                className="flex-1 border border-gray-600 text-gray-400 py-2 rounded-xl hover:bg-gray-800">
                Start Over
              </button>
              <button onClick={() => setStep("chat")}
                className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">
                Ask Follow-up Questions
              </button>
            </div>
          </div>
        )}

        {/* CHAT */}
        {step === "chat" && (
          <div className="bg-gray-900 rounded-2xl shadow p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setStep("results")} className="text-blue-400 text-sm">← Back to results</button>
            </div>
            <h2 className="font-bold text-white text-lg">Ask Follow-up Questions</h2>

            <div className="h-72 overflow-y-auto space-y-3 border border-gray-700 rounded-xl p-3 bg-gray-950">
              {chatMessages.length === 0 && (
                <p className="text-gray-500 text-sm text-center mt-20">Ask anything about your symptoms...</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                    msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 border border-gray-700 text-gray-300"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 px-3 py-2 rounded-xl text-sm text-gray-500">Thinking...</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input type="text" placeholder="e.g. What foods should I avoid?"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleChat()}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl p-2 text-white text-sm placeholder-gray-500" />
              <button onClick={handleChat}
                className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700">
                Send
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}