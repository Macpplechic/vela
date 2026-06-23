// Type declarations for react-native-health
// The package doesn't ship its own .d.ts — this stub satisfies TypeScript
// without affecting runtime behavior.

declare module 'react-native-health' {
  export const Permissions: Record<string, string>;

  interface HealthKitOptions {
    permissions: { read: string[]; write: string[] };
  }

  interface HealthValue {
    value: number;
    startDate: string;
    endDate: string;
  }

  interface SleepSample {
    value: string;
    startDate: string;
    endDate: string;
  }

  const AppleHealthKit: {
    initHealthKit(options: HealthKitOptions, callback: (err: string | null) => void): void;
    getStepCount(options: any, callback: (err: any, result: any) => void): void;
    getSleepSamples(options: any, callback: (err: any, results: SleepSample[]) => void): void;
    getRestingHeartRateSamples(options: any, callback: (err: any, results: HealthValue[]) => void): void;
    getHeartRateVariabilitySamples(options: any, callback: (err: any, results: HealthValue[]) => void): void;
    getDailyStepCountSamples(options: any, callback: (err: any, results: HealthValue[]) => void): void;
  };

  export default AppleHealthKit;
}
