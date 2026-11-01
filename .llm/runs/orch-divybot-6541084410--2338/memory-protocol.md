# Producer restart protocol

Upstream producer epochs are client-declared, not allocated by a session endpoint. Empty POST/[] are invalid, HEAD has no producer epoch query. 204 duplicate deduplicates by tuple without comparing bytes. Persist an atomic monotonic epoch per path+producer ID; sequence restarts at zero. Existing autoClaim only bumps on 403 and cannot distinguish a recreated epoch-zero write from duplicate retry.
