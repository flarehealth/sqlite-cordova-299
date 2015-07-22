#!/usr/bin/env ruby

require 'csv'
require 'json'

DATA_FILE = File.expand_path('../FakeNameGenerator.com_1afefa5d/FakeNameGenerator.com_1afefa5d.csv', __FILE__)
OUTPUT_FILE = File.expand_path('../../www/js/fake_remote_data.js', __FILE__)

def documents
  docs = []
  CSV.foreach(DATA_FILE, headers: true) do |csv|
    docs << {
      _id: csv['GUID'],
      given_name: csv['GivenName'],
      surname: csv['Surname'],
      email_address: csv['EmailAddress'],
      city: csv['City'],
      national_id: csv['NationalID']
    }
  end
  docs
end

def create_javascript_source
  File.open(OUTPUT_FILE, 'w') do |f|
    f.write "var FAKE_REMOTE_DATA = "
    f.puts JSON.pretty_generate(documents)
  end
end

create_javascript_source
