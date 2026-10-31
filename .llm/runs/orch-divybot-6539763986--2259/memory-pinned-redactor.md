# Aspire 13.5.3 composed-secret limitation — 2026-10-31

The installed Aspire.Hosting 13.5.3 backchannel redactor masks a resolved value only when it
equals an entire secret parameter value. A secret parameter inside ReferenceExpression and
AddConnectionString(ReferenceExpression) both retain credential bytes after that actual
redactor. The latter creates ConnectionStringResource, outside the ParameterResource-only
secret collector. See spike/Program.cs and spike/result.txt for the fresh reproduction.

Do not infer masking from reference provenance or successful runtime resolution. The direct
parameter is the positive masking control. A diagnostic zero exit proves valid measurement;
read BLOCKED/CAPABLE separately. INVALID controls prohibit either claim. No whole-snapshot,
dashboard, or database acceptance is established by this isolated SDK proof.
