package com.acme.salary.seed;

import java.util.List;
import java.util.Map;

/** Given and family names per country, so the directory looks like a real multinational. */
final class NamePools {

    record Pool(List<String> first, List<String> last) {
    }

    private static final Pool ANGLO = new Pool(
            List.of("James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
                    "David", "Elizabeth", "William", "Susan", "Daniel", "Jessica", "Matthew",
                    "Sarah", "Andrew", "Emily", "Joshua", "Olivia", "Ryan", "Chloe", "Liam", "Grace"),
            List.of("Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson",
                    "Taylor", "Anderson", "Thomas", "Moore", "Martin", "Thompson", "White",
                    "Harris", "Clark", "Lewis", "Walker", "Hall", "Young", "King", "Wright", "Scott"));

    private static final Map<String, Pool> BY_COUNTRY = Map.of(
            "US", ANGLO,
            "GB", ANGLO,
            "CA", ANGLO,
            "AU", ANGLO,
            "IN", new Pool(
                    List.of("Aarav", "Priya", "Rahul", "Ananya", "Vikram", "Sneha", "Arjun",
                            "Kavya", "Rohan", "Isha", "Aditya", "Pooja", "Karan", "Neha", "Siddharth",
                            "Divya", "Shankar", "Meera", "Nikhil", "Riya"),
                    List.of("Sharma", "Patel", "Kumar", "Singh", "Reddy", "Iyer", "Nair", "Gupta",
                            "Joshi", "Mehta", "Rao", "Kulkarni", "Desai", "Kamble", "Chopra",
                            "Banerjee", "Menon", "Pillai", "Verma", "Shah")),
            "DE", new Pool(
                    List.of("Lukas", "Anna", "Leon", "Lena", "Felix", "Sophie", "Jonas", "Marie",
                            "Paul", "Laura", "Maximilian", "Julia", "Tobias", "Katharina"),
                    List.of("Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner",
                            "Becker", "Schulz", "Hoffmann", "Koch", "Richter", "Klein", "Wolf")),
            "FR", new Pool(
                    List.of("Louis", "Camille", "Hugo", "Léa", "Jules", "Chloé", "Arthur", "Manon",
                            "Gabriel", "Inès", "Théo", "Zoé", "Raphaël", "Élise"),
                    List.of("Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit",
                            "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefèvre", "Michel")),
            "SG", new Pool(
                    List.of("Wei", "Mei", "Jun", "Hui", "Kai", "Xin", "Ravi", "Siti", "Ming", "Lin",
                            "Arun", "Nur", "Jia", "Hao"),
                    List.of("Tan", "Lim", "Lee", "Ng", "Wong", "Goh", "Chua", "Chan", "Koh", "Teo",
                            "Ong", "Rahman", "Kumar", "Ho")),
            "BR", new Pool(
                    List.of("Miguel", "Alice", "Arthur", "Helena", "Davi", "Valentina", "Bernardo",
                            "Laura", "Heitor", "Beatriz", "Lucas", "Júlia", "Pedro", "Mariana"),
                    List.of("Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
                            "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho")));

    static Pool forCountry(String countryCode) {
        Pool pool = BY_COUNTRY.get(countryCode);
        if (pool == null) {
            throw new IllegalArgumentException("No name pool for country " + countryCode);
        }
        return pool;
    }

    private NamePools() {
    }
}
