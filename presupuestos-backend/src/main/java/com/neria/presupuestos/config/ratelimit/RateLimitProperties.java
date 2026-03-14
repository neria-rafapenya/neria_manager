package com.neria.presupuestos.config.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "presupuestos.rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;
    private Policy defaults = new Policy(120, 120, 60);
    private Policy ai = new Policy(30, 30, 60);

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Policy getDefaults() {
        return defaults;
    }

    public void setDefaults(Policy defaults) {
        this.defaults = defaults;
    }

    public Policy getAi() {
        return ai;
    }

    public void setAi(Policy ai) {
        this.ai = ai;
    }

    public static class Policy {
        private long capacity;
        private long refillTokens;
        private long refillPeriodSeconds;

        public Policy() {
        }

        public Policy(long capacity, long refillTokens, long refillPeriodSeconds) {
            this.capacity = capacity;
            this.refillTokens = refillTokens;
            this.refillPeriodSeconds = refillPeriodSeconds;
        }

        public long getCapacity() {
            return capacity;
        }

        public void setCapacity(long capacity) {
            this.capacity = capacity;
        }

        public long getRefillTokens() {
            return refillTokens;
        }

        public void setRefillTokens(long refillTokens) {
            this.refillTokens = refillTokens;
        }

        public long getRefillPeriodSeconds() {
            return refillPeriodSeconds;
        }

        public void setRefillPeriodSeconds(long refillPeriodSeconds) {
            this.refillPeriodSeconds = refillPeriodSeconds;
        }
    }
}
