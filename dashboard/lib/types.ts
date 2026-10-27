export interface ShapFeature {
  feature: string;
  value: number | string;
  contribution: number; // positive = pushes toward phishing, negative = pushes toward legitimate
  description?: string;
}

export interface ThreatIntelResult {
  is_malicious: boolean;
  source?: string;
  domain_age_days?: number | null;
  ssl_valid?: boolean;
  reputation_score?: number; // 0 - 100
  ip_address?: string;
  country?: string;
  dns_valid?: boolean;
  threat_types?: string[];
  virustotal_positives?: number;
  virustotal_total?: number;
  threat_feeds_result?: Record<string, { detected: boolean; details: string }>;
  sources_checked?: string[];
}

export interface BlockchainCommitment {
  block_index: number;
  block_hash: string;
  prev_hash: string;
  tx_hash?: string;
  timestamp: string;
  committed: boolean;
}

export interface ScanResult {
  id: string;
  url: string;
  verdict: 'PHISHING' | 'LEGITIMATE';
  confidence: number; // 0 - 100 percentage
  risk_score: number; // 0 - 100 scale
  timestamp: string;
  shap_features: ShapFeature[];
  threat_intel: ThreatIntelResult;
  blockchain?: BlockchainCommitment;
  processing_time_ms?: number;
  extracted_features?: Record<string, string | number | boolean>;
}

export interface Block {
  index: number;
  timestamp: string;
  url_hash: string;
  prediction: 'PHISHING' | 'LEGITIMATE';
  confidence: number;
  risk_score?: number;
  block_hash: string;
  prev_hash: string;
  nonce?: number;
  target_url?: string;
}

export interface Stats {
  total_scans: number;
  phishing_detected: number;
  legitimate_detected: number;
  detection_rate: number; // e.g. 98.7%
  avg_latency_ms?: number;
  verified_blocks?: number;
}

export interface VerifyResult {
  is_valid: boolean;
  message: string;
  total_blocks: number;
  verified_at: string;
  tampered_block_index?: number | null;
}
