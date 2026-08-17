# frozen_string_literal: true

# Mirrors packages/relaton-api/src/lib/normalize.ts — keep both in sync.
module RelatonApi
  module Ingest
    module Normalize
      SCOPE_WRAPPER = /\A([A-Za-z0-9]{1,8})\((.+)\)\z/m.freeze
      TRAILING_YEAR = /:(\d{4})(?=[^-]*$)/.freeze
      PARENS_YEAR = /\((?:19|20)\d{2}\)\z/.freeze
      TRAILING_PART = /-\d+[A-Z]?\z/.freeze

      module_function

      def normalize_code(input)
        input.gsub(/[—–]/, "-")
             .gsub(/[\p{Z} ]+/u, " ")
             .strip
             .sub(SCOPE_WRAPPER) { Regexp.last_match(2) }
      end

      def norm_key(input)
        normalize_code(input).upcase.delete(" ")
      end

      def undated_key(norm)
        norm.sub(TRAILING_YEAR, "").sub(PARENS_YEAR, "")
      end

      def all_parts_key(norm)
        undated_key(norm).sub(TRAILING_PART, "")
      end
    end
  end
end
