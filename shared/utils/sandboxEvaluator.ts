import _ from "lodash";
import dayjs from "dayjs";
import qs from "qs";

// List of global variables that should be blocked from the sandbox
const BLACKLIST = new Set([
  "window",
  "document",
  "fetch",
  "location",
  "XMLHttpRequest",
  "localStorage",
  "sessionStorage",
  "chrome",
  "MutationObserver",
  "Navigator"
]);

// A Proxy that catches all operations and returns itself, acting as a safe "black hole"
// This prevents attackers from chaining properties (e.g. document.body.innerHTML)
export function createBlackHole(): any {
  return new Proxy(
    function () {
      return createBlackHole();
    },
    {
      get(target, prop) {
        if (prop === "toString" || prop === Symbol.toPrimitive) {
          return () => "";
        }
        return createBlackHole();
      },
    }
  );
}

const defaultLibs = {
  _: _,
  dayjs: dayjs,
  qs: qs,
};

/**
 * Evaluates a javascript code snippet within a secure sandbox.
 * @param codeSnippet - The javascript string to evaluate. (e.g. `{{ _.map(data, 'id') }}`)
 * @param customContext - An object containing variables to expose to the snippet.
 * @returns The evaluation result, or undefined if an error occurred.
 */
export function evaluateCode(codeSnippet: string, customContext: Record<string, any> = {}) {
  // Extract only the code inside {{ }} if present, otherwise evaluate the whole string
  let executableSnippet = codeSnippet.trim();
  const dynamicMatch = executableSnippet.match(/^{{(.*)}}$/s);
  if (dynamicMatch) {
    executableSnippet = dynamicMatch[1].trim();
  }

  // Combine default injected libraries with the provided context
  const combinedContext = {
    ...defaultLibs,
    ...customContext
  };

  // Wrap context in a Proxy
  const sandbox = new Proxy(combinedContext, {
    // The 'has' trap makes the 'with' statement think all variables exist on this object
    // so it doesn't try to look them up on the global window object.
    has() {
      return true;
    },
    get(target, prop) {
      if (prop === Symbol.unscopables) {
        return undefined;
      }
      // Block blacklisted globals
      if (BLACKLIST.has(prop as string)) {
        console.warn(`[Sandbox] Blocked access to blacklisted variable: ${String(prop)}`);
        return createBlackHole();
      }
      // Return value from custom context
      if (prop in target) {
        return Reflect.get(target, prop);
      }
      
      // Fallback to safe globals (Math, String, etc) directly from globalThis
      if (typeof globalThis !== "undefined" && prop in globalThis) {
        const val = Reflect.get(globalThis, prop);
        if (typeof val === "function" && !val.prototype) {
          // Bind native functions like parseInt to the global object
          return val.bind(globalThis);
        }
        return val;
      }

      return undefined;
    },
  });

  // Construct the secure execution block
  // 'with(this)' sets the variable scope to the sandbox proxy
  const executableCode = `
    with(this) {
      return (function() { 
        "use strict"; 
        return ${executableSnippet}; 
      }).call(this);
    }
  `;

  try {
    const vm = new Function(executableCode);
    return vm.call(sandbox); // Run the code with our Proxy as 'this'
  } catch (error) {
    console.error("Sandbox Evaluation error:", error);
    return undefined;
  }
}
