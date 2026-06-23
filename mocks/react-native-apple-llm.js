// Mock for react-native-apple-llm
// The real package only exists on iOS 26+ and is not installed.
// This stub prevents Metro from failing to resolve the module at bundle time.
// At runtime, useVelaCoach checks Platform.OS and iOS version before calling these.

module.exports = {
  isFoundationModelsEnabled: async () => 'unavailable',
  AppleLLMSession: class {
    async configure() {}
    async generateText() { return ''; }
    reset() {}
  },
};
