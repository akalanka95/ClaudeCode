package com.interviewprep.backend.sync;

import com.interviewprep.backend.sync.dto.SyncLink;
import java.util.List;

/** Structured shape the model is asked to return for a sync run; not exposed over the API. */
record SyncResult(String summary, List<SyncLink> links) {}
