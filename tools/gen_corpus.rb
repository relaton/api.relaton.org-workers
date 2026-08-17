#!/usr/bin/env ruby
# frozen_string_literal: true

# Generates golden fixtures for the TS port of pubid:
#   packages/pubid-ts/data/update-codes/<flavor>.json  (converted from pubid's YAML, order preserved)
#   packages/pubid-ts/test/corpus.json                 (real docids + canonical renders from Ruby pubid)

require "json"
require "yaml"
require "fileutils"

PUBID_DATA = "/Users/mulgogi/src/pubid/pubid/data"
OUT_DATA = File.expand_path("../packages/pubid-ts/data/update-codes", __dir__)
OUT_TEST = File.expand_path("../packages/pubid-ts/test", __dir__)
FileUtils.mkdir_p(OUT_DATA)
FileUtils.mkdir_p(OUT_TEST)

def conv_replacement(s)
  # Ruby gsub "\1" backreferences → JS "$1"
  s.to_s.gsub(/\\(\d)/, '$\1')
end

Dir[File.join(PUBID_DATA, "*", "update_codes.yaml")].each do |path|
  flavor = File.basename(File.dirname(path))
  data = YAML.load_file(path) || {}
  pairs = data.map { |k, v| [k.to_s, conv_replacement(v)] }
  File.binwrite(File.join(OUT_DATA, "#{flavor}.json"), JSON.pretty_generate(pairs))
  puts "update-codes: #{flavor} (#{pairs.size} rules)"
end

require "pubid"
LOAD = {
  "iso" => "pubid/iso", "iec" => "pubid/iec", "ieee" => "pubid/ieee",
  "itu" => "pubid/itu", "nist" => "pubid/nist", "iho" => "pubid/iho",
  "bsi" => "pubid/bsi", "ccsds" => "pubid/ccsds", "etsi" => "pubid/etsi",
  "plateau" => "pubid/plateau",
}.freeze
MODS = LOAD.filter_map do |flavor, path|
  require path
  [flavor, Pubid.const_get(flavor.capitalize.to_sym, false)]
rescue LoadError, NameError
end.to_h

REPOS = {
  "iso" => "/Users/mulgogi/src/relaton/relaton-data-iso",
  "ieee" => "/Users/mulgogi/src/relaton/relaton-data-ieee",
  "iho" => "/Users/mulgogi/src/relaton/relaton-data-iho",
}.freeze

def primary_docid(path)
  doc = YAML.safe_load(File.read(path), aliases: true) || {}
  list = doc["docidentifier"] || []
  d = list.find { |x| x["primary"] } || list.first
  d && d["content"]
rescue StandardError
  nil
end

inputs = []
REPOS.each do |flavor, repo|
  files = Dir[File.join(repo, "data", "*.yaml")].sort
  step = [(files.size / 120.0).ceil, 1].max
  files.each_with_index do |f, i|
    next unless (i % step).zero?

    code = primary_docid(f)
    inputs << { flavor: flavor, input: code } if code
  end
  Dir[File.join(repo, "static", "**", "*.yaml")].sort.each do |f|
    code = primary_docid(f)
    inputs << { flavor: flavor, input: code } if code
  end
end

EXTRA = [
  ["itu", "ITU-T G.7710/Y.1705 (2001)"], ["itu", "ITU-T G.989.2"],
  ["itu", "ITU-R V.574-5"], ["itu", "ITU-T G.6501"],
  ["nist", "NIST SP 800-53 Rev. 5"], ["nist", "NIST FIPS 140-3"],
  ["nist", "NIST IR 8115"], ["nist", "NBS CIRC 24e7sup"],
  ["iso", "ISO/IEC Directives Part 1"], ["iso", "ISO/IEC DIR 1"],
  ["iso", "ISO/IEC DIR IEC SUP"], ["iso", "JCGM 200:2008"],
  ["iso", "ISO 2631/DAD 1"], ["iso", "ИСО 639-1"],
  ["iso", "ISO/AWI IWA 47"], ["iso", "ISO/CD 31010"],
  ["iso", "ISO/DIS 31010"], ["iso", "ISO/FDIS 9001"],
  ["iso", "ISO 9001:2015/Amd 1:2018"], ["iso", "ISO/TS 8000-1:2019"],
  ["iso", "ISO/TR 17716"], ["iso", "ISO/R 657-4:1969"],
  ["iso", "ISO/IEC IEEE 8802-22:2015/Amd.2:2017"],
  ["iso", "ISO 19115-1:2014/Cor 1:2016"], ["iso", "ISO 19115 (all parts)"],
  ["iec", "IEC 61010-2-201:2015+AMD1:2018 CSV"], ["iec", "IEC 60285-/1:1989"],
  ["ieee", "IEEE 802.3"], ["ieee", "IEEE Std 802.3-2015"],
  ["ieee", "IEEE 11073-10101"], ["ieee", "IEEE/ISO/IEC 8802-3"],
].freeze
inputs.concat(EXTRA.map { |flavor, input| { flavor: flavor, input: input } })

corpus = inputs.filter_map do |s|
  mod = MODS[s[:flavor]]
  next { **s, parseable: false, reason: "no module" } unless mod

  id = begin
    mod.parse(s[:input])
  rescue StandardError => e
    next { **s, parseable: false, reason: e.class.name }
  end
  canonical = id.to_s
  norm = canonical.upcase.delete(" ")
  undated = norm.gsub(/:?(?:19|20)\d{2}(?=[^-]*$)/, "")
  raw_part = nil
  begin
    raw_part = id.part || (id.base && id.base.part)
  rescue NoMethodError
    nil
  end
  part = raw_part.is_a?(String) ? raw_part : raw_part&.value.to_s
  allparts = part && !part.empty? ? undated.sub(/-#{Regexp.escape(part)}(?=[^-]*$)/, "") : undated
  { flavor: s[:flavor], input: s[:input], parseable: true,
    canonical: canonical, year: id.year&.to_s,
    keys: { norm: norm, undated: undated, allparts: allparts } }
end

File.binwrite(File.join(OUT_TEST, "corpus.json"), JSON.pretty_generate(corpus))
ok = corpus.count { |c| c[:parseable] }
puts "corpus: #{corpus.size} entries (#{ok} parseable, #{corpus.size - ok} not)"
puts corpus.reject { |c| c[:parseable] }.first(10).map { |c| "  [#{c[:flavor]}] #{c[:input]} — #{c[:reason]}" }
