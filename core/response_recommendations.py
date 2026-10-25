"""Advisory Attack Response Recommendation Layer.

Phase 7B.4: Implement and Evaluate an Advisory Attack Response Recommendation Layer
Project: Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

CRITICAL RESEARCH BOUNDARIES:
- This module implements STRICTLY ADVISORY recommendations for human operators or incident response teams.
- It DOES NOT execute autonomous remediation, firewall alterations, IP bans, connection drops, host quarantines, or active defense.
- It DOES NOT perform network, filesystem, or blockchain operations.
- It DOES NOT invoke machine learning models or retrain classifiers.
- Recommendations explicitly acknowledge classification uncertainty and upstream model error propagation.
"""

from __future__ import annotations

import copy
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Tuple


SUPPORTED_CATEGORIES: Tuple[str, ...] = (
    "Normal",
    "Analysis",
    "Backdoor",
    "DoS",
    "Exploits",
    "Fuzzers",
    "Generic",
    "Reconnaissance",
    "Shellcode",
    "Worms",
)

ATTACK_CATEGORIES: Tuple[str, ...] = (
    "Analysis",
    "Backdoor",
    "DoS",
    "Exploits",
    "Fuzzers",
    "Generic",
    "Reconnaissance",
    "Shellcode",
    "Worms",
)


@dataclass(frozen=True)
class AdvisoryResponseRecommendation:
    """Structured advisory guidance object mapped deterministically from an IDS classification."""

    category: str
    severity: str
    investigation_priority: str
    recommended_action: str
    operator_guidance: str
    rationale: str
    limitations: str
    is_advisory: bool = True
    requires_human_approval: bool = True
    automated_remediation_enabled: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert the recommendation object to a standard dictionary."""
        return asdict(self)


_ADVISORY_TAXONOMY: Dict[str, AdvisoryResponseRecommendation] = {
    "Normal": AdvisoryResponseRecommendation(
        category="Normal",
        severity="Informational",
        investigation_priority="Low",
        recommended_action=(
            "No immediate defensive intervention required. Maintain continuous telemetry collection "
            "and routine anomaly-detection baseline updates."
        ),
        operator_guidance=(
            "Continue standard baseline monitoring. Audit periodic false-negative rates and ensure "
            "logging infrastructure operates without dropped packets."
        ),
        rationale=(
            "Flow statistical features correspond to established non-malicious baseline communication "
            "profiles within the evaluated network topology."
        ),
        limitations=(
            "Advisory classification. Normal attribution does not guarantee the complete absence of subtle, "
            "stealthy, or novel evasion techniques (Stage 1 false-negative rate is 13.18%)."
        ),
    ),
    "Analysis": AdvisoryResponseRecommendation(
        category="Analysis",
        severity="Medium",
        investigation_priority="Medium",
        recommended_action=(
            "Inspect unusual protocol and port-probing behavior. Correlate with firewall and DNS query telemetry, "
            "and review potential reconnaissance or port-scan indicators."
        ),
        operator_guidance=(
            "Review originating host IP connection patterns, port sweep frequencies, protocol header anomalies, "
            "and correlation with known vulnerability-scanning tools."
        ),
        rationale=(
            "Analysis-classified traffic typically reflects automated vulnerability scanning, port probing, "
            "or protocol fingerprinting preceding active intrusion attempts."
        ),
        limitations=(
            "Advisory only. Stage 2 multiclass classification demonstrates acute minority-class limitations "
            "for Analysis (2.95% end-to-end recall). Misclassifications with benign administration traffic or "
            "other probe types are frequent."
        ),
    ),
    "Backdoor": AdvisoryResponseRecommendation(
        category="Backdoor",
        severity="High",
        investigation_priority="High",
        recommended_action=(
            "Investigate unexpected persistence or remote-access mechanisms on the target endpoint. "
            "Review authentication logs, unusual process creation, and recent system configuration changes."
        ),
        operator_guidance=(
            "Examine endpoint process trees, listening sockets, outbound reverse-shell connections, "
            "and user logon records for the destination host."
        ),
        rationale=(
            "Backdoor traffic characteristics indicate covert remote administrative channels, reverse TCP tunnels, "
            "or unauthorized persistent access mechanisms."
        ),
        limitations=(
            "Advisory only. Stage 2 exhibits substantial confusion between Backdoor instances and DoS/Exploits "
            "(11.57% end-to-end recall). Manual endpoint telemetry verification is required prior to concluding host compromise."
        ),
    ),
    "DoS": AdvisoryResponseRecommendation(
        category="DoS",
        severity="High",
        investigation_priority="High",
        recommended_action=(
            "Inspect traffic volume and connection-rate anomalies. Consider operator-approved rate limiting, "
            "connection throttling, or upstream packet filtering, while actively monitoring service availability."
        ),
        operator_guidance=(
            "Review source IP distribution, TCP SYN or UDP flood characteristics, interface queue depths, "
            "and application response latencies on the target server."
        ),
        rationale=(
            "Denial-of-Service flow characteristics reflect high-frequency packet transmission aimed at exhaustively "
            "consuming network bandwidth, socket tables, or CPU resources."
        ),
        limitations=(
            "Advisory only. Legitimate traffic spikes (flash crowds) or transient network congestion can match DoS "
            "statistical signatures. Does not independently prove malicious intent."
        ),
    ),
    "Exploits": AdvisoryResponseRecommendation(
        category="Exploits",
        severity="High",
        investigation_priority="High",
        recommended_action=(
            "Inspect targeted application and daemon service logs. Review known vulnerability and patch status, "
            "and investigate suspicious payload or malformed request patterns."
        ),
        operator_guidance=(
            "Correlate payload signatures with CVE advisories, inspect web server and database query logs for injection "
            "or buffer-overflow attempts, and verify application integrity."
        ),
        rationale=(
            "Exploit traffic exhibits structural or payload traits consistent with weaponized attempts to compromise "
            "known software vulnerabilities in exposed network services."
        ),
        limitations=(
            "Advisory only. Does not confirm that an exploit payload succeeded or that the target service was vulnerable. "
            "Stage 2 achieved 53.78% end-to-end recall on Exploits."
        ),
    ),
    "Fuzzers": AdvisoryResponseRecommendation(
        category="Fuzzers",
        severity="Medium",
        investigation_priority="Medium",
        recommended_action=(
            "Inspect malformed or out-of-specification request patterns. Review application parser error logs, "
            "and consider input-validation hardening and rate-limiting controls."
        ),
        operator_guidance=(
            "Check application crash telemetry, exception logs, protocol syntax violations, and high-frequency "
            "parameter mutation sequences directed at input handlers."
        ),
        rationale=(
            "Fuzzing involves injecting semi-random, boundary-condition, or malformed data streams to trigger software faults "
            "or identify unhandled parsing exceptions."
        ),
        limitations=(
            "Advisory only. Stage 1 has a severe false-negative filtering bottleneck on Fuzzers (74.35% missed at Stage 1, "
            "yielding 14.83% end-to-end recall). Flows reaching this recommendation represent only a fraction of true fuzzing attempts."
        ),
    ),
    "Generic": AdvisoryResponseRecommendation(
        category="Generic",
        severity="Medium",
        investigation_priority="Medium",
        recommended_action=(
            "Perform secondary incident triage. Correlate network flow evidence with endpoint and security information logs, "
            "and investigate source and destination operational context."
        ),
        operator_guidance=(
            "Review cryptographic protocol consistency, destination IP reputation scores, and traffic volume against "
            "baseline profiles to identify the specific threat vector."
        ),
        rationale=(
            "Generic classifications capture cryptographic block-cipher collisions and generalized signature matches "
            "across broad attack templates."
        ),
        limitations=(
            "Advisory only. Generic serves as a broad umbrella classification (98.06% end-to-end recall), meaning secondary "
            "investigation is necessary to determine the precise underlying attack type."
        ),
    ),
    "Reconnaissance": AdvisoryResponseRecommendation(
        category="Reconnaissance",
        severity="Medium",
        investigation_priority="Medium",
        recommended_action=(
            "Inspect scanning and sweep activity. Review source IP behavior across multiple destination ports and services, "
            "and evaluate network perimeter monitoring policies."
        ),
        operator_guidance=(
            "Analyze horizontal port sweeps, ICMP ping sweeps, banner grabbing attempts, and firewall drop counters "
            "associated with the originating IP address."
        ),
        rationale=(
            "Reconnaissance traffic seeks to map network topology, active host addresses, and listening service versions "
            "to prepare for targeted secondary intrusion attempts."
        ),
        limitations=(
            "Advisory only. Authorized network administration tasks, internal asset inventory scanners, and monitoring probes "
            "produce flow profiles identical to malicious reconnaissance."
        ),
    ),
    "Shellcode": AdvisoryResponseRecommendation(
        category="Shellcode",
        severity="Critical",
        investigation_priority="Critical",
        recommended_action=(
            "Inspect endpoint process, memory, and host-level security telemetry. Investigate possible code-execution "
            "payloads, and review affected service binary and memory integrity."
        ),
        operator_guidance=(
            "Examine memory execution logs, abnormal child processes spawned by network services, in-memory payload staging, "
            "and outbound command-and-control beacons."
        ),
        rationale=(
            "Shellcode traffic carries compact machine-code instructions intended to hijack program control flow and spawn "
            "an interactive command shell upon exploitation."
        ),
        limitations=(
            "Advisory only. Shellcode achieved 63.46% end-to-end recall in the benchmark evaluation. The recommendation does not "
            "confirm that memory execution occurred or that the target host was successfully compromised."
        ),
    ),
    "Worms": AdvisoryResponseRecommendation(
        category="Worms",
        severity="Critical",
        investigation_priority="Critical",
        recommended_action=(
            "Investigate possible lateral propagation across network nodes. Inspect east-west communication patterns, "
            "and evaluate network segmentation and containment options with human authorization."
        ),
        operator_guidance=(
            "Audit internal lateral traffic for uniform scanning and payload replication patterns, inspect adjacent subnet "
            "activity, and verify endpoint patch levels for wormable vulnerabilities."
        ),
        rationale=(
            "Worms self-propagate autonomously across network vulnerabilities, posing immediate compounding risk to "
            "interconnected IoT devices and internal subnets."
        ),
        limitations=(
            "Advisory only. The underlying UNSW-NB15 training distribution contained only 130 Worms instances, creating "
            "high classification uncertainty (15.38% end-to-end recall). Requires rapid human validation."
        ),
    ),
}


def get_response_recommendation(category: str) -> Dict[str, Any]:
    """Retrieve the deterministic advisory response recommendation for a given IDS output category.

    Args:
        category: The predicted category string ('Normal' or one of the 9 attack categories).

    Returns:
        A dictionary containing the structured advisory response recommendation.

    Raises:
        ValueError: If category is empty or not a string.
        KeyError: If category is not in the supported taxonomy.
    """
    if not isinstance(category, str):
        raise ValueError(f"Category must be a string, got {type(category).__name__}")

    clean_category = category.strip()
    if not clean_category:
        raise ValueError("Category string must not be empty or whitespace-only")

    if clean_category not in _ADVISORY_TAXONOMY:
        raise KeyError(
            f"Unsupported category '{clean_category}'. Supported categories are: {list(SUPPORTED_CATEGORIES)}"
        )

    return _ADVISORY_TAXONOMY[clean_category].to_dict()


def get_all_response_recommendations() -> Dict[str, Dict[str, Any]]:
    """Retrieve all advisory response recommendations across the complete supported taxonomy.

    Returns:
        A dictionary mapping each supported category to its structured advisory response recommendation.
    """
    return {cat: rec.to_dict() for cat, rec in _ADVISORY_TAXONOMY.items()}
