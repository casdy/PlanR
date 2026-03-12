# Incident Response Playbook (PlanR)

This document outlines the procedures for identifying, containing, and recovering from cybersecurity incidents, in alignment with NIST CSF 2.0 (Tier 3 Maturity).

## 1. Detection & Analysis
- **Indicators of Compromise (IoC)**:
  - Unauthorized access logs in Supabase.
  - Significant spikes in API usage (429 errors in logs).
  - Reports of data corruption or unauthorized changes by users.
- **Triage**: Categorize incident by severity (Low, Medium, High, Critical) based on potential data exposure.

## 2. Containment, Eradication & Recovery
- **Immediate Actions (Containment)**:
  - Rotate API keys (Groq, Wger, RapidAPI) in Vercel environment.
  - Revoke suspicious auth sessions in Supabase dashboard.
  - Temporarily disable affected API proxies in `vercel.json`.
- **Eradication**:
  - Patch identified vulnerabilities.
  - Remove any backdoors or persistent access points.
- **Recovery**:
  - Restore data from Supabase backups if necessary.
  - Validate system integrity before resuming full operations.

## 3. Post-Incident Activity
- **Lessons Learned**: Conduct a "retrospective" to identify root cause.
- **System Hardening**: Apply new security controls to prevent recurrence.

---

> [!NOTE]
> This playbook is a living document and should be reviewed and tested annually through simulated tabletop exercises.
