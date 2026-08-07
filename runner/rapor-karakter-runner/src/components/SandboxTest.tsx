import React, { useState } from "react";
import { evaluateCode } from "@shared/utils/sandboxEvaluator";

export function SandboxTest() {
  const [input, setInput] = useState("{{ Math.max(user.age, 18) }}");
  const [result, setResult] = useState<any>("");

  // This is the data we want to expose to our template
  const customContext = {
    user: {
      name: "John Doe",
      age: 15,
      role: "student",
    },
    // We could inject libraries here too (e.g., _: lodash)
  };

  const handleEvaluate = () => {
    // Evaluate the code securely
    const evalResult = evaluateCode(input, customContext);
    
    if (evalResult === undefined) {
      setResult("Error evaluating code. See console.");
    } else {
      // Stringify objects so they look nice in the UI
      setResult(typeof evalResult === 'object' ? JSON.stringify(evalResult, null, 2) : String(evalResult));
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto border rounded-lg shadow-sm bg-white mt-10">
      <h2 className="text-xl font-bold mb-4">Sandbox Evaluator Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Context (Data)
        </label>
        <pre className="p-3 bg-gray-100 rounded text-sm text-gray-800">
          {JSON.stringify(customContext, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          JS Expression Template
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded font-mono text-sm"
          rows={3}
          placeholder="{{ user.name }}"
        />
      </div>

      <button
        onClick={handleEvaluate}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
      >
        Evaluate
      </button>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Result
        </label>
        <div className="p-3 border rounded bg-gray-50 min-h-[40px] font-mono whitespace-pre-wrap">
          {result}
        </div>
      </div>
    </div>
  );
}
